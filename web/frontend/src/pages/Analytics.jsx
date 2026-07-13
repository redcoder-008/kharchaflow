import { useMemo } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency } from "../utils/helpers";
import { CATEGORIES } from "../utils/constants";
import { 
  AreaChart, 
  Area, 
  XAxis, 
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

  // 1. Last 7 Days Spending Data for AreaChart
  const dailySpendData = useMemo(() => {
    const list = [];
    const now = new Date();

    // Setup past 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      list.push({ date: dateStr, name: label, amount: 0 });
    }

    // Accumulate expenses
    transactions.forEach((tx) => {
      if (tx.type === "expense") {
        const match = list.find((item) => item.date === tx.date);
        if (match) {
          match.amount += Number(tx.amount);
        }
      }
    });

    return list;
  }, [transactions]);

  // 2. Budget Utilization Calculations for Current Month
  const budgetUtilization = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const categoryExpenses = {};

    // Sum actual expenses for current month
    transactions.forEach((tx) => {
      if (tx.type === "expense" && tx.date.startsWith(currentMonth)) {
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
  }, [transactions, budgets]);

  // 3. Spending Breakdown by Payment Source
  const methodSpending = useMemo(() => {
    const methodTotals = {};
    let totalExpense = 0;

    transactions.forEach((tx) => {
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
  }, [transactions]);

  // Quick total summary for header
  const totalWeeklySpend = useMemo(() => {
    return dailySpendData.reduce((acc, item) => acc + item.amount, 0);
  }, [dailySpendData]);

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
      
      {/* 1. Header Trend Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Spending Line Chart (AreaChart) */}
        <div className="finance-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3.5 mb-4">
            <div>
              <h4 className="text-xs font-bold text-white tracking-tight uppercase">Daily Spending (Last 7 Days)</h4>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Total weekly volume: <span className="text-emerald-400 font-bold">{formatCurrency(totalWeeklySpend)}</span>
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

      {/* 2. Secondary Breakdown Grid */}
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
