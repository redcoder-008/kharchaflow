import { useEffect, useMemo, useState } from "react";
import { useFinance } from "../context/FinanceContext";
import { useCalendar } from "../context/CalendarContext";
import { formatCurrency, formatMonth, formatWeekday } from "../utils/helpers";
import { CATEGORIES } from "../utils/constants";
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis,
  CartesianGrid,
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { 
  TrendingDown, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck, 
  Coins
} from "lucide-react";

export default function Analytics() {
  const { transactions, budgets } = useFinance();
  const { dateSystem } = useCalendar();
  const [selectedMonth, setSelectedMonth] = useState("");

  const availableMonths = useMemo(() => [...new Set(
    transactions.filter((tx) => /^\d{4}-\d{2}/.test(tx.date || "")).map((tx) => tx.date.slice(0, 7))
  )].sort((a, b) => b.localeCompare(a)), [transactions]);

  const activeMonth = selectedMonth || availableMonths[0] || new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (!selectedMonth && availableMonths[0]) setSelectedMonth(availableMonths[0]);
  }, [availableMonths, selectedMonth]);

  const selectedTransactions = useMemo(() => transactions.filter((tx) => tx.date?.startsWith(activeMonth)), [transactions, activeMonth]);

  const monthlyTotals = useMemo(() => selectedTransactions.reduce((totals, tx) => {
    const amount = Number(tx.amount) || 0;
    if (tx.type === "income") totals.income += amount;
    if (tx.type === "expense") totals.expense += amount;
    return totals;
  }, { income: 0, expense: 0 }), [selectedTransactions]);

  const categoryBreakdown = useMemo(() => {
    const totals = {};
    selectedTransactions.filter((tx) => tx.type === "expense").forEach((tx) => {
      const category = tx.category || "Others";
      totals[category] = (totals[category] || 0) + (Number(tx.amount) || 0);
    });
    return Object.entries(totals).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [selectedTransactions]);

  // 1. Daily spending for the selected month
  const dailySpendData = useMemo(() => {
    const list = [];
    const [year, month] = activeMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${activeMonth}-${String(day).padStart(2, "0")}`;
      const label = formatWeekday(dateStr, dateSystem);
      list.push({ date: dateStr, name: label, amount: 0 });
    }

    selectedTransactions.forEach((tx) => {
      if (tx.type === "expense") {
        const match = list.find((item) => item.date === tx.date);
        if (match) {
          match.amount += Number(tx.amount);
        }
      }
    });

    return list;
  }, [selectedTransactions, activeMonth, dateSystem]);

  // 2. Budget Utilization Calculations for Current Month
  const budgetUtilization = useMemo(() => {
    const categoryExpenses = {};

    // Sum actual expenses for current month
    selectedTransactions.forEach((tx) => {
      if (tx.type === "expense") {
        const cat = tx.category || "Others";
        categoryExpenses[cat] = (categoryExpenses[cat] || 0) + Number(tx.amount);
      }
    });

    // Match with user budgets
    return Object.entries(CATEGORIES)
      .filter(([catName]) => catName !== "Income")
      .map(([catName, catInfo]) => {
        const limit = Number(budgets[catName]) || 150; // fallback default
        const spent = categoryExpenses[catName] || 0;
        const percentage = Math.min(100, limit > 0 ? Math.round((spent / limit) * 100) : 0);
        return {
          name: catName,
          icon: catInfo.icon,
          bgClass: catInfo.bgClass,
          color: catInfo.color,
          limit,
          spent,
          percentage
        };
      })
      .sort((a, b) => b.percentage - a.percentage); // Category closest to budget breach first
  }, [selectedTransactions, budgets]);

  // 3. Spending Breakdown by Payment Source
  const methodSpending = useMemo(() => {
    const methodTotals = {};
    let totalExpense = 0;

    selectedTransactions.forEach((tx) => {
      if (tx.type === "expense") {
        const method = tx.paymentMethod || "Cash";
        const amt = Number(tx.amount) || 0;
        methodTotals[method] = (methodTotals[method] || 0) + amt;
        totalExpense += amt;
      }
    });

    return Object.entries(methodTotals).map(([name, value]) => {
      const pct = totalExpense > 0 ? Math.round((value / totalExpense) * 100) : 0;
      return { name, value, pct };
    }).sort((a, b) => b.value - a.value);
  }, [selectedTransactions]);

  // Quick total summary for header
  const totalMonthlySpend = useMemo(() => {
    return dailySpendData.reduce((acc, item) => acc + item.amount, 0);
  }, [dailySpendData]);

  // 5. Month-by-month income, expense, and savings review
  const monthlyReview = useMemo(() => {
    const monthlyTotals = {};

    transactions.forEach((tx) => {
      if (!tx.date || !/^\d{4}-\d{2}/.test(tx.date)) return;

      const month = tx.date.slice(0, 7);
      const amount = Number(tx.amount) || 0;
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = { income: 0, expense: 0 };
      }

      if (tx.type === "income") {
        monthlyTotals[month].income += amount;
      } else if (tx.type === "expense") {
        monthlyTotals[month].expense += amount;
      }
    });

    return Object.entries(monthlyTotals)
      .map(([month, totals]) => {
        const savings = totals.income - totals.expense;
        return {
          month,
          label: formatMonth(`${month}-01`, dateSystem),
          ...totals,
          savings,
          savingsRate: totals.income > 0 ? Math.round((savings / totals.income) * 100) : 0
        };
      })
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [transactions, dateSystem]);

  // General recommendation/AI insight mock
  const financialInsight = useMemo(() => {
    const breached = budgetUtilization.filter((b) => b.spent > b.limit);
    if (breached.length > 0) {
      return {
        type: "warning",
        title: "Budget Breach Alert",
        desc: `You have exceeded your monthly limit in ${breached.map(b => b.name).join(", ")}. Consider slowing down optional purchases.`
      };
    }
    return {
      type: "success",
      title: "Excellent Control",
      desc: "All active categories are well within their planned thresholds. You are on track to meet your savings goals."
    };
  }, [budgetUtilization]);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="finance-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-tight">Monthly Analytics</h3>
          <p className="text-xs text-zinc-500 mt-1">Choose a month from your transaction history to review its financial activity.</p>
        </div>
        <select value={activeMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="finance-input sm:w-52 py-2.5 text-xs font-bold" aria-label="Select analytics month">
          {availableMonths.length === 0 ? <option value={activeMonth}>{formatMonth(`${activeMonth}-01`, dateSystem)}</option> : availableMonths.map((month) => <option key={month} value={month}>{formatMonth(`${month}-01`, dateSystem)}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="finance-card"><p className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Total Income</p><p className="mt-2 text-xl font-bold text-emerald-400">{formatCurrency(monthlyTotals.income)}</p></div>
        <div className="finance-card"><p className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Total Expenses</p><p className="mt-2 text-xl font-bold text-rose-400">{formatCurrency(monthlyTotals.expense)}</p></div>
        <div className="finance-card"><p className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Net Savings</p><p className={`mt-2 text-xl font-bold ${monthlyTotals.income - monthlyTotals.expense >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatCurrency(monthlyTotals.income - monthlyTotals.expense)}</p></div>
      </div>
      
      {/* 1. Header Trend Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Spending Line Chart (AreaChart) */}
        <div className="finance-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3.5 mb-4">
            <div>
              <h4 className="text-xs font-bold text-white tracking-tight uppercase">Daily Spending — {formatMonth(`${activeMonth}-01`, dateSystem)}</h4>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Total monthly spending: <span className="text-emerald-400 font-bold">{formatCurrency(totalMonthlySpend)}</span>
              </p>
            </div>
            <TrendingDown className="w-5 h-5 text-rose-400" />
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySpendData}>
                <defs>
                  <linearGradient id="spendColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-chart-tooltip">
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">{payload[0].payload.date}</p>
                          <span className="font-semibold text-zinc-300">Spent: </span>
                          <span className="font-bold text-emerald-400">{formatCurrency(payload[0].value)}</span>
                        </div>
                      );
                    }
                    return null;
                  }} 
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#spendColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Financial Health Card */}
        <div className="finance-card flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-zinc-800/60 pb-3.5 mb-2">
            <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
            <h4 className="text-xs font-bold text-white tracking-tight uppercase">Kharcha Insights</h4>
          </div>
          
          <div className="flex-1 flex flex-col justify-center py-2 space-y-3">
            <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
              financialInsight.type === "warning" 
                ? "bg-rose-500/5 border-rose-500/10 text-rose-300" 
                : "bg-emerald-500/5 border-emerald-500/10 text-emerald-300"
            }`}>
              {financialInsight.type === "warning" ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-xs font-bold text-white">{financialInsight.title}</p>
                <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">{financialInsight.desc}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950/40 border border-zinc-850/60 rounded-xl p-3.5 flex items-center justify-between text-xs font-medium">
            <span className="text-zinc-500">Suggested Action</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              Optimize budget caps
            </span>
          </div>
        </div>
      </div>

      <div className="finance-card">
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3.5 mb-4">
          <div><h4 className="text-xs font-bold text-white tracking-tight uppercase">Expense Categories</h4><p className="text-xs text-zinc-500 mt-0.5">Category-wise expense breakdown for the selected month.</p></div>
          <Coins className="w-5 h-5 text-emerald-400" />
        </div>
        {categoryBreakdown.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">No expense categories recorded for this month.</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={categoryBreakdown} layout="vertical" margin={{ left: 8, right: 16 }}><CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} /><XAxis type="number" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} /><YAxis type="category" dataKey="name" width={92} tick={{ fill: "#a1a1aa", fontSize: 11 }} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "12px", fontSize: "12px" }} /><Bar dataKey="amount" name="Expenses" fill="#10b981" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 2. Monthly Financial Review */}
      <div className="finance-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3.5 mb-4">
          <div>
            <h4 className="text-xs font-bold text-white tracking-tight uppercase">Monthly Expense & Savings Review</h4>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">Review every month recorded in your ledger.</p>
          </div>
        </div>

        {monthlyReview.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-1.5 text-zinc-600">
            <Coins className="w-7 h-7" />
            <p className="text-xs">Add transactions to see your monthly expense and savings review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  <th className="pb-3 pl-2">Month</th>
                  <th className="pb-3 text-right">Income</th>
                  <th className="pb-3 text-right">Expenses</th>
                  <th className="pb-3 text-right">Savings</th>
                  <th className="pb-3 text-right pr-2">Savings Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/50 text-xs">
                {monthlyReview.map((month) => {
                  const isSaving = month.savings >= 0;
                  return (
                    <tr key={month.month} className="hover:bg-zinc-950/30 transition-colors">
                      <td className="py-3.5 pl-2 font-bold text-zinc-200">{month.label}</td>
                      <td className="py-3.5 text-right font-semibold text-emerald-400">{formatCurrency(month.income)}</td>
                      <td className="py-3.5 text-right font-semibold text-rose-400">{formatCurrency(month.expense)}</td>
                      <td className={`py-3.5 text-right font-bold ${isSaving ? "text-emerald-400" : "text-rose-400"}`}>
                        {isSaving ? "+" : "-"}{formatCurrency(Math.abs(month.savings))}
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${isSaving ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                          {month.savingsRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Secondary Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Budget Thresholds */}
        <div className="finance-card lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3.5">
            <h4 className="text-xs font-bold text-white tracking-tight uppercase">Monthly Budget Targets</h4>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Current allocations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetUtilization.map((b) => {
              const Icon = b.icon;
              const isOver = b.spent > b.limit;
              return (
                <div key={b.name} className="bg-zinc-950/40 border border-zinc-850/60 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${b.bgClass}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-xs font-bold text-zinc-200">{b.name}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isOver 
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/10" 
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                    }`}>
                      {b.percentage}% spent
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-zinc-900 rounded-full h-2 border border-zinc-850/60">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${isOver ? "bg-rose-500" : "bg-emerald-500"}`}
                        style={{ width: `${b.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 font-semibold pt-1">
                      <span>Spent: <strong className={isOver ? "text-rose-400" : "text-zinc-400"}>{formatCurrency(b.spent)}</strong></span>
                      <span>Limit: <strong>{formatCurrency(b.limit)}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Source Split */}
        <div className="finance-card space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3.5">
            <h4 className="text-xs font-bold text-white tracking-tight uppercase">Spending by Source</h4>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Expense split</span>
          </div>

          <div className="space-y-4">
            {methodSpending.length === 0 ? (
              <div className="py-14 flex flex-col items-center justify-center text-center gap-1.5 text-zinc-600">
                <Coins className="w-6 h-6" />
                <p className="text-xs">No payment methods recorded yet.</p>
              </div>
            ) : (
              methodSpending.map((m) => (
                <div key={m.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 font-medium">{m.name}</span>
                    <span className="text-zinc-200 font-bold">
                      {formatCurrency(m.value)}{" "}
                      <span className="text-[10px] text-zinc-500 font-normal">({m.pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-1.5">
                    <div 
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${m.pct}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
