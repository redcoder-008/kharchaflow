import { useState, useEffect } from "react";
import { useFinance } from "../../context/FinanceContext";
import { useCalendar } from "../../context/CalendarContext";
import { CATEGORIES, PAYMENT_METHODS, EWALLET_PROVIDERS, BANK_PROVIDERS } from "../../utils/constants";
import { formatCurrency, nepaliDateInputToIso, toNepaliDateInput } from "../../utils/helpers";
import { 
  X, 
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown
} from "lucide-react";

export default function AddTransactionModal({ isOpen, onClose, editingTransaction, setActivePage, defaultType }) {
  const { addTransaction, editTransaction, currentBalances } = useFinance();
  const { dateSystem } = useCalendar();
  
  // Form state fields
  const [type, setType] = useState("expense"); // expense or income
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [nepaliDate, setNepaliDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [provider, setProvider] = useState("");
  const [notes, setNotes] = useState("");
  
  // Validation / Loading states
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Setup form fields on edit mode toggle
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type || "expense");
      setAmount(editingTransaction.amount ? String(editingTransaction.amount) : "");
      setCategory(editingTransaction.category || "Food");
      setDate(editingTransaction.date || new Date().toISOString().split("T")[0]);
      setNepaliDate(toNepaliDateInput(editingTransaction.date || new Date().toISOString().split("T")[0]));
      setPaymentMethod(editingTransaction.paymentMethod || "Cash");
      setProvider(editingTransaction.provider || "");
      setNotes(editingTransaction.notes || "");
    } else {
      // Reset form fields, honour defaultType if provided
      setType(defaultType || "expense");
      setAmount("");
      setCategory("Food");
      setDate(new Date().toISOString().split("T")[0]);
      setNepaliDate(toNepaliDateInput(new Date().toISOString().split("T")[0]));
      setPaymentMethod("Cash");
      setProvider("");
      setNotes("");
    }
    setError("");
  }, [editingTransaction, isOpen, defaultType]);

  useEffect(() => {
    if (dateSystem === "nepali") {
      setNepaliDate(toNepaliDateInput(date));
    }
  }, [dateSystem, date]);

  // Adjust provider and category defaults when payment method or type changes
  useEffect(() => {
    if (editingTransaction) return; // Keep original state during editing
    
    // Automatically match provider defaults
    if (paymentMethod === "eWallet") {
      setProvider(EWALLET_PROVIDERS[0]);
    } else if (paymentMethod === "Bank Account" || paymentMethod === "Mobile Banking") {
      setProvider(BANK_PROVIDERS[0]);
    } else {
      setProvider("");
    }
  }, [paymentMethod, editingTransaction]);

  useEffect(() => {
    if (editingTransaction) return;
    
    // Set auto categories based on type
    if (type === "income") {
      setCategory("Income");
    } else {
      setCategory("Food");
    }
  }, [type, editingTransaction]);

  const getAvailableBalance = () => {
    if (!currentBalances) return 0;
    let bal = 0;
    if (paymentMethod === "Cash") {
      bal = currentBalances["Cash"] || 0;
    } else if (paymentMethod === "Credit Card") {
      bal = currentBalances["Credit Card"] || 0;
    } else if (paymentMethod === "eWallet") {
      bal = (currentBalances["eWallet"] && provider) ? (currentBalances["eWallet"][provider] || 0) : 0;
    } else if (paymentMethod === "Bank Account") {
      bal = (currentBalances["Bank Account"] && provider) ? (currentBalances["Bank Account"][provider] || 0) : 0;
    } else if (paymentMethod === "Mobile Banking") {
      bal = (currentBalances["Mobile Banking"] && provider) ? (currentBalances["Mobile Banking"][provider] || 0) : 0;
    }

    if (editingTransaction && editingTransaction.paymentMethod === paymentMethod) {
      const isProviderMatch = ["Cash", "Credit Card"].includes(paymentMethod) || editingTransaction.provider === provider;
      if (isProviderMatch) {
        const editAmount = Number(editingTransaction.amount);
        if (editingTransaction.type === "income") {
          bal -= editAmount;
        } else {
          bal += editAmount;
        }
      }
    }
    return bal;
  };

  const availableBalance = getAvailableBalance();
  const numericAmount = Number(amount || 0);
  const resultingBalance = type === "expense" 
    ? availableBalance - numericAmount 
    : availableBalance + numericAmount;

  if (!isOpen) return null;

  const handleFormValidation = () => {
    setError("");
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return false;
    }
    const transactionDate = dateSystem === "nepali" ? nepaliDateInputToIso(nepaliDate) : date;
    if (!transactionDate) {
      setError(dateSystem === "nepali" ? "Enter a valid Bikram Sambat date in YYYY-MM-DD format." : "Please select a valid date.");
      return false;
    }
    if (!category) {
      setError("Please select a transaction category.");
      return false;
    }
    if (!paymentMethod) {
      setError("Please select a payment method.");
      return false;
    }
    // Provider check
    if (["eWallet", "Bank Account", "Mobile Banking"].includes(paymentMethod) && !provider) {
      setError(`Please select a provider for your ${paymentMethod}.`);
      return false;
    }
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!handleFormValidation()) return;

    setSaving(true);
    const transactionDate = dateSystem === "nepali" ? nepaliDateInputToIso(nepaliDate) : date;
    const txObject = {
      amount: Number(amount),
      type,
      category: type === "income" ? "Income" : category,
      date: transactionDate,
      paymentMethod,
      provider: ["Cash", "Credit Card"].includes(paymentMethod) ? "" : provider,
      notes: notes.trim()
    };

    try {
      if (editingTransaction) {
        await editTransaction(editingTransaction.id, txObject);
      } else {
        await addTransaction(txObject);
        if (setActivePage) setActivePage("dashboard");
      }
      onClose();
    } catch (err) {
      console.error("Save transaction error: ", err);
      setError("Failed to record transaction. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex items-end justify-center md:inset-0 md:items-center md:p-4 bg-zinc-950/80 backdrop-blur-sm"
      style={{ height: '100dvh' }}
    >
      {/* Tap-out zone to close modal */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Main Drawer Shell */}
      <div
        className="w-full md:max-w-xl bg-zinc-900 border border-zinc-800 md:rounded-3xl rounded-t-3xl shadow-2xl relative z-10 flex flex-col animate-slide-up md:animate-none overflow-hidden"
        style={{
          /* Mobile: cap to 90dvh so it shrinks with keyboard and never covers bottom nav */
          maxHeight: 'min(90dvh, calc(100dvh - env(safe-area-inset-bottom, 0px)))',
        }}
      >
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/60">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {editingTransaction ? "Edit Transaction" : "Record Money Flow"}
          </h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-850 hover:border-zinc-850 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          
          {/* Validation Error alerts */}
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* 1. Transaction Type Selector (Income vs Expense) */}
          <div className="grid grid-cols-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-850/60">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                type === "expense" 
                  ? "bg-rose-500/10 border border-rose-500/10 text-rose-400 shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <TrendingDown className="w-4 h-4 stroke-[2.2]" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                type === "income" 
                  ? "bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <TrendingUp className="w-4 h-4 stroke-[2.2]" />
              Income
            </button>
          </div>

          {/* 2. Amount Input (Large Typography) */}
          <div>
            <label htmlFor="amount" className="finance-label">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-[17px] text-lg font-bold text-zinc-400">Rs.</span>
              <input
                id="amount"
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-xl font-bold text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                autoFocus
              />
            </div>
            
            {/* Dynamic Balance Indicator */}
            <div className="mt-2.5 bg-zinc-950/50 border border-zinc-850/50 rounded-xl p-3 space-y-1.5">
              <div className="text-xs flex justify-between items-center">
                <span className="text-zinc-550 font-medium">Available Balance:</span>
                <span className={`font-bold ${availableBalance < 0 ? "text-rose-500" : "text-zinc-350"}`}>
                  {formatCurrency(availableBalance)}
                </span>
              </div>
              {numericAmount > 0 && (
                <div className="text-xs flex justify-between items-center border-t border-zinc-850/40 pt-1.5">
                  <span className="text-zinc-550 font-medium">Resulting Balance:</span>
                  <span className={`font-extrabold ${resultingBalance < 0 ? "text-rose-500" : "text-emerald-400"}`}>
                    {formatCurrency(resultingBalance)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Transaction Date */}
          <div>
            <label htmlFor="date" className="finance-label">Transaction Date {dateSystem === "nepali" ? "(Bikram Sambat)" : ""}</label>
            <div className="relative">
              <input
                id="date"
                type={dateSystem === "nepali" ? "text" : "date"}
                inputMode={dateSystem === "nepali" ? "numeric" : undefined}
                placeholder={dateSystem === "nepali" ? "2083-04-01" : undefined}
                value={dateSystem === "nepali" ? nepaliDate : date}
                onChange={(e) => dateSystem === "nepali" ? setNepaliDate(e.target.value) : setDate(e.target.value)}
                required
                className="finance-input pl-10"
              />
              <Calendar className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
            </div>
            {dateSystem === "nepali" && <p className="mt-1.5 text-[10px] text-zinc-500">Enter the Nepali date as YYYY-MM-DD.</p>}
          </div>

          {/* 4. Category Selector (Only for expenses, locked as Income for Income type) */}
          {type === "expense" && (
            <div>
              <label className="finance-label">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.values(CATEGORIES).map((cat) => {
                  if (cat.name === "Income") return null;
                  const Icon = cat.icon;
                  const isSelected = category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        isSelected 
                          ? `${cat.bgClass} scale-[1.03]` 
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1.5" />
                      <span className="text-[10px] font-semibold tracking-tight">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Payment Method Selector */}
          <div>
            <label className="finance-label">Payment Method</label>
            <div className="grid grid-cols-5 gap-2">
              {Object.values(PAYMENT_METHODS).map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.name;
                return (
                  <button
                    key={method.name}
                    type="button"
                    onClick={() => setPaymentMethod(method.name)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                      isSelected 
                        ? `${method.bgClass} border-${method.color}-500/20 scale-[1.03]` 
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-250"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5 mb-1.5" />
                    <span className="text-[9px] font-bold text-center leading-none">{method.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Dynamic Providers Grid */}
          {paymentMethod === "eWallet" && (
            <div>
              <label className="finance-label">Wallet Provider</label>
              <div className="grid grid-cols-3 gap-3">
                {EWALLET_PROVIDERS.map((prov) => {
                  const isSelected = provider === prov;
                  return (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setProvider(prov)}
                      className={`py-3 px-4 rounded-xl border font-bold text-sm text-center transition-all ${
                        isSelected 
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 scale-[1.02]" 
                          : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {prov}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(paymentMethod === "Bank Account" || paymentMethod === "Mobile Banking") && (
            <div>
              <label htmlFor="provider" className="finance-label">Bank Partner</label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="finance-input"
              >
                {BANK_PROVIDERS.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
          )}

          {/* 7. Transaction Notes */}
          <div>
            <label htmlFor="notes" className="finance-label">Notes (Optional)</label>
            <div className="relative">
              <textarea
                id="notes"
                placeholder="e.g. Starbucks house coffee with friends"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                disabled={saving}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all pl-10"
              />
              <FileText className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
            </div>
          </div>

          {/* 8. Save Trigger Button — sticky at sheet bottom so it's always visible */}
        </form>
        <div
          className="px-6 pb-4 pt-3 border-t border-zinc-800/60 bg-zinc-900 shrink-0"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.98]"
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>{editingTransaction ? "Save Changes" : "Record Transaction"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
