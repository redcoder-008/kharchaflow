import { useMemo, useState } from "react";
import { useFinance } from "../context/FinanceContext";
import { useCalendar } from "../context/CalendarContext";
import { useFeedback } from "../context/FeedbackContext";
import { formatCurrency, formatDate } from "../utils/helpers";
import { AlertCircle, CheckCircle2, CirclePlus, Pencil, Plus, Target, Trash2, WalletCards, X } from "lucide-react";

const blankGoal = { name: "", targetAmount: "", currentAmount: "", targetDate: "" };

export default function Goals() {
  const { financialGoals, saveFinancialGoals } = useFinance();
  const { dateSystem } = useCalendar();
  const { confirm, notify } = useFeedback();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(blankGoal);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savingGoal, setSavingGoal] = useState(null);
  const [savingAmount, setSavingAmount] = useState("");
  const [savingError, setSavingError] = useState("");

  const summary = useMemo(() => financialGoals.reduce((totals, goal) => {
    totals.target += Number(goal.targetAmount) || 0;
    totals.saved += Number(goal.currentAmount) || 0;
    if ((Number(goal.currentAmount) || 0) >= (Number(goal.targetAmount) || 0)) totals.completed += 1;
    return totals;
  }, { target: 0, saved: 0, completed: 0 }), [financialGoals]);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(blankGoal);
    setError("");
  };

  const openEdit = (goal) => {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount || 0),
      targetDate: goal.targetDate || ""
    });
    setError("");
    setIsFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const targetAmount = Number(form.targetAmount);
    const currentAmount = Number(form.currentAmount || 0);
    if (!form.name.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0 || !Number.isFinite(currentAmount) || currentAmount < 0) {
      setError("Enter a goal name, a target greater than zero, and a valid saved amount.");
      return;
    }

    const now = new Date().toISOString();
    const goal = {
      id: editingId || `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: form.name.trim(),
      targetAmount,
      currentAmount,
      targetDate: form.targetDate,
      createdAt: editingId ? financialGoals.find((item) => item.id === editingId)?.createdAt || now : now,
      updatedAt: now
    };
    const nextGoals = editingId
      ? financialGoals.map((item) => item.id === editingId ? goal : item)
      : [goal, ...financialGoals];

    setIsSaving(true);
    try {
      await saveFinancialGoals(nextGoals);
      closeForm();
    } catch {
      setError("Your goal could not be saved. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteGoal = async (id) => {
    if (!await confirm({ title: "Delete financial goal?", message: "This goal and its progress will be removed permanently.", confirmLabel: "Delete goal", tone: "danger" })) return;
    try {
      await saveFinancialGoals(financialGoals.filter((goal) => goal.id !== id));
    } catch {
      notify("Unable to delete this goal. Please try again.", "danger");
    }
  };

  const closeAddSaving = () => {
    setSavingGoal(null);
    setSavingAmount("");
    setSavingError("");
  };

  const addSaving = async (event) => {
    event.preventDefault();
    const amount = Number(savingAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setSavingError("Enter a saving amount greater than zero.");
      return;
    }
    if (!savingGoal) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      await saveFinancialGoals(financialGoals.map((goal) => goal.id === savingGoal.id
        ? { ...goal, currentAmount: (Number(goal.currentAmount) || 0) + amount, updatedAt: now }
        : goal));
      notify(`${formatCurrency(amount)} added to ${savingGoal.name}.`, "success");
      closeAddSaving();
    } catch {
      setSavingError("Your saving could not be added. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="finance-card">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Goals Saved</p>
          <p className="mt-2 text-xl font-bold text-emerald-400">{formatCurrency(summary.saved)}</p>
        </div>
        <div className="finance-card">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Targeted Savings</p>
          <p className="mt-2 text-xl font-bold text-zinc-100">{formatCurrency(summary.target)}</p>
        </div>
        <div className="finance-card">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Completed Goals</p>
          <p className="mt-2 text-xl font-bold text-zinc-100">{summary.completed} <span className="text-sm text-zinc-500">of {financialGoals.length}</span></p>
        </div>
      </div>

      <div className="finance-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/60 pb-4 mb-5">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight uppercase">Financial Goals</h4>
            <p className="text-xs text-zinc-500 mt-0.5">Plan savings targets and keep their progress up to date.</p>
          </div>
          <button onClick={() => setIsFormOpen(true)} className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> Add Goal
          </button>
        </div>

        {financialGoals.length === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center text-center gap-2">
            <Target className="w-9 h-9 text-zinc-700" />
            <h5 className="text-sm font-semibold text-zinc-400">No financial goals yet</h5>
            <p className="text-xs text-zinc-600 max-w-sm">Create a goal for an emergency fund, trip, purchase, or any savings target.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {financialGoals.map((goal) => {
              const target = Number(goal.targetAmount) || 0;
              const saved = Number(goal.currentAmount) || 0;
              const progress = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
              const complete = saved >= target;
              return (
                <div key={goal.id} className="bg-zinc-950/40 border border-zinc-850/60 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${complete ? "bg-emerald-500/15 text-emerald-400" : "bg-indigo-500/10 text-indigo-400"}`}>
                        {complete ? <CheckCircle2 className="w-5 h-5" /> : <WalletCards className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-sm font-bold text-zinc-100 truncate">{goal.name}</h5>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{goal.targetDate ? `Target: ${formatDate(goal.targetDate, dateSystem)}` : "No target date"}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(goal)} className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors" aria-label={`Edit ${goal.name}`}><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteGoal(goal.id)} className="p-2 text-zinc-500 hover:text-rose-400 transition-colors" aria-label={`Delete ${goal.name}`}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-end justify-between gap-3 mb-2">
                      <span className="text-sm font-bold text-emerald-400">{formatCurrency(saved)}</span>
                      <span className="text-[10px] font-semibold text-zinc-500">of {formatCurrency(target)}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-zinc-900"><div className={`h-full rounded-full ${complete ? "bg-emerald-400" : "bg-indigo-500"}`} style={{ width: `${progress}%` }} /></div>
                    <div className="mt-2 flex justify-between text-[10px] font-bold"><span className={complete ? "text-emerald-400" : "text-zinc-400"}>{complete ? "Goal reached" : `${progress}% complete`}</span><span className="text-zinc-500">{formatCurrency(Math.max(0, target - saved))} remaining</span></div>
                  </div>
                  <button onClick={() => { setSavingGoal(goal); setSavingAmount(""); setSavingError(""); }} className="w-full px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                    <CirclePlus className="w-4 h-4" /> Add Saving
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-5"><h3 className="text-base font-bold text-white">{editingId ? "Update Financial Goal" : "New Financial Goal"}</h3><button onClick={closeForm} className="text-zinc-500 hover:text-zinc-200"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
              <div><label htmlFor="goal-name" className="text-xs font-semibold text-zinc-400">Goal name</label><input id="goal-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Emergency fund" className="finance-input mt-1.5 py-2.5 text-sm" autoFocus /></div>
              <div className="grid grid-cols-2 gap-3"><div><label htmlFor="goal-target" className="text-xs font-semibold text-zinc-400">Target amount</label><input id="goal-target" type="number" min="0" step="any" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder="0.00" className="finance-input mt-1.5 py-2.5 text-sm" /></div><div><label htmlFor="goal-saved" className="text-xs font-semibold text-zinc-400">Saved so far</label><input id="goal-saved" type="number" min="0" step="any" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} placeholder="0.00" className="finance-input mt-1.5 py-2.5 text-sm" /></div></div>
              <div><label htmlFor="goal-date" className="text-xs font-semibold text-zinc-400">Target date <span className="text-zinc-600">(optional)</span></label><input id="goal-date" type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} className="finance-input mt-1.5 py-2.5 text-sm" /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={closeForm} className="px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-zinc-200">Cancel</button><button disabled={isSaving} type="submit" className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-zinc-950 text-xs font-bold">{isSaving ? "Saving..." : editingId ? "Save Changes" : "Create Goal"}</button></div>
            </form>
          </div>
        </div>
      )}

      {savingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-2"><h3 className="text-base font-bold text-white">Add Saving</h3><button onClick={closeAddSaving} disabled={isSaving} className="text-zinc-500 hover:text-zinc-200 disabled:opacity-50" aria-label="Close add saving"><X className="w-5 h-5" /></button></div>
            <p className="text-xs text-zinc-500 mb-5">Add a contribution to <span className="font-semibold text-zinc-300">{savingGoal.name}</span>. Its progress will update immediately.</p>
            <form onSubmit={addSaving} className="space-y-4">
              {savingError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{savingError}</div>}
              <div>
                <label htmlFor="saving-amount" className="text-xs font-semibold text-zinc-400">Saving amount</label>
                <input id="saving-amount" type="number" min="0.01" step="any" value={savingAmount} onChange={(e) => setSavingAmount(e.target.value)} placeholder="0.00" className="finance-input mt-1.5 py-2.5 text-sm" autoFocus />
              </div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={closeAddSaving} disabled={isSaving} className="px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-zinc-200 disabled:opacity-50">Cancel</button><button disabled={isSaving} type="submit" className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-zinc-950 text-xs font-bold">{isSaving ? "Adding..." : "Add Saving"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
