import { useState, useMemo } from "react";
import { useFinance } from "../context/FinanceContext";
import { useCalendar } from "../context/CalendarContext";
import { formatCurrency, formatDate, formatMonth } from "../utils/helpers";
import { CATEGORIES } from "../utils/constants";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Trash2,
  ChevronDown,
  ChevronUp,
  Landmark,
  Coins,
  Smartphone,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";
import AddTransactionModal from "../components/transactions/AddTransactionModal";

export default function Dashboard() {
  const { transactions, totals, currentBalances, deleteTransaction } =
    useFinance();
  const { dateSystem } = useCalendar();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [defaultType, setDefaultType] = useState("expense");
  const [expandedSource, setExpandedSource] = useState(null); // 'bank', 'wallet', 'mobile' or null

  // Helper to open modal pre-set to a specific type
  const openAdd = (type) => {
    setDefaultType(type);
    setIsAddOpen(true);
  };

  // Calculate current month statistics (income, expense, savings)
  const stats = useMemo(() => {
    const now = new Date();
    const currentYearMonth = now.toISOString().slice(0, 7); // YYYY-MM

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    transactions.forEach((tx) => {
      if (tx.date.startsWith(currentYearMonth)) {
        const amt = Number(tx.amount) || 0;
        if (tx.type === "income") {
          monthlyIncome += amt;
        } else {
          monthlyExpense += amt;
        }
      }
    });

    const monthlySavings = monthlyIncome - monthlyExpense;
    const savingsRate =
      monthlyIncome > 0
        ? Math.round((monthlySavings / monthlyIncome) * 100)
        : 0;

    return {
      income: monthlyIncome,
      expense: monthlyExpense,
      savings: monthlySavings,
      savingsRate: Math.max(0, savingsRate),
    };
  }, [transactions]);

  // Aggregate Category Expense Data for Pie Chart
  const categoryChartData = useMemo(() => {
    const categoryTotals = {};

    transactions.forEach((tx) => {
      if (tx.type === "expense") {
        const cat = tx.category || "Others";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(tx.amount);
      }
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORIES[name]?.colorHex || "#71717a",
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Aggregate Spending Trends by Month (Last 5 Months) for Bar Chart
  const trendChartData = useMemo(() => {
    const monthlyData = {};
    const monthsToShow = 5;

    // Initialize last 5 months
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7); // YYYY-MM
      const label = formatMonth(d.toISOString().slice(0, 10), dateSystem, true);
      monthlyData[key] = { name: label, income: 0, expense: 0 };
    }

    // Populate data
    transactions.forEach((tx) => {
      const key = tx.date.slice(0, 7);
      if (monthlyData[key]) {
        const amt = Number(tx.amount) || 0;
        if (tx.type === "income") {
          monthlyData[key].income += amt;
        } else {
          monthlyData[key].expense += amt;
        }
      }
    });

    return Object.values(monthlyData);
  }, [transactions, dateSystem]);

  const toggleSourceExpand = (source) => {
    if (expandedSource === source) {
      setExpandedSource(null);
    } else {
      setExpandedSource(source);
    }
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 1. Dashboard Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Asset Balance */}
        <div className="finance-card flex flex-col justify-between col-span-2 lg:col-span-1 min-h-36">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-zinc-400">
              Total Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3
              className={`text-2xl font-bold tracking-tight mt-4 ${totals.net < 0 ? "text-rose-500 font-extrabold animate-pulse" : "text-white"}`}
            >
              {formatCurrency(totals.net)}
            </h3>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase mt-1">
              Overall Net Assets
            </p>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="finance-card flex flex-col justify-between min-h-36">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-zinc-400">
              Monthly Income
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-emerald-400 mt-4">
              {formatCurrency(stats.income)}
            </h3>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase mt-1">
              This Month
            </p>
          </div>
        </div>

        {/* Monthly Expense */}
        <div className="finance-card flex flex-col justify-between min-h-36">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-zinc-400">
              Monthly Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-rose-400 mt-4">
              {formatCurrency(stats.expense)}
            </h3>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase mt-1">
              This Month
            </p>
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="finance-card flex flex-col justify-between col-span-2 lg:col-span-1 min-h-36">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-zinc-400">
              Savings & Rate
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {stats.savingsRate}% Rate
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white mt-4">
              {formatCurrency(stats.savings)}
            </h3>
            <div className="w-full bg-zinc-950 rounded-full h-1.5 mt-2">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, stats.savingsRate)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Layout Grid: Balance Breakdown & Quick Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Balances by Payment Source */}
        <div className="finance-card lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <h4 className="text-sm font-bold text-white tracking-tight uppercase">
              Payment Sources
            </h4>
            {/* Add Income + Add Expense CTA buttons */}
            <div className="flex flex-col gap-2">
              {/* Add Income — solid emerald CTA */}
              <button
                onClick={() => openAdd("income")}
                className="group relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold
               bg-gradient-to-b from-emerald-400 to-emerald-500 text-zinc-950
               border border-emerald-300/40
               shadow-[0_2px_8px_-2px_rgba(16,185,129,0.5)]
               hover:from-emerald-300 hover:to-emerald-400
               hover:shadow-[0_4px_14px_-2px_rgba(16,185,129,0.65)]
               hover:-translate-y-0.5
               active:translate-y-0 active:scale-95 active:shadow-[0_1px_4px_-1px_rgba(16,185,129,0.5)]
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
               transition-all duration-150 ease-out cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 transition-transform duration-150 group-hover:scale-110 group-hover:-translate-y-px" />
                <span>Add Income</span>
              </button>

              {/* Add Expense — solid rose CTA */}
              <button
                onClick={() => openAdd("expense")}
                className="group relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold
               bg-gradient-to-b from-rose-400 to-rose-500 text-white
               border border-rose-300/40
               shadow-[0_2px_8px_-2px_rgba(244,63,94,0.5)]
               hover:from-rose-300 hover:to-rose-400
               hover:shadow-[0_4px_14px_-2px_rgba(244,63,94,0.65)]
               hover:-translate-y-0.5
               active:translate-y-0 active:scale-95 active:shadow-[0_1px_4px_-1px_rgba(244,63,94,0.5)]
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
               transition-all duration-150 ease-out cursor-pointer"
              >
                <TrendingDown className="w-3.5 h-3.5 transition-transform duration-150 group-hover:scale-110 group-hover:translate-y-px" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Cash Balance */}
            <div className="bg-zinc-950/40 border border-zinc-850/60 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Coins className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-300">
                    Cash Balance
                  </p>
                  <p className="text-[10px] text-zinc-500">Physical Currency</p>
                </div>
              </div>
              <span
                className={`text-sm font-bold ${totals.cash < 0 ? "text-rose-500" : "text-zinc-200"}`}
              >
                {formatCurrency(totals.cash)}
              </span>
            </div>

            {/* Credit Card Balance */}
            <div className="bg-zinc-950/40 border border-zinc-850/60 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <CreditCard className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-300">
                    Credit Card Balance
                  </p>
                  <p className="text-[10px] text-zinc-500">Outstanding Limit</p>
                </div>
              </div>
              <span
                className={`text-sm font-bold ${totals.creditCard < 0 ? "text-rose-500" : "text-zinc-200"}`}
              >
                {formatCurrency(totals.creditCard)}
              </span>
            </div>

            {/* Bank Accounts */}
            <div className="bg-zinc-950/40 border border-zinc-850/60 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSourceExpand("bank")}
                className="w-full p-3.5 flex items-center justify-between outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Landmark className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-zinc-300">
                      Bank Accounts
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Traditional deposits
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${totals.bank < 0 ? "text-rose-500" : "text-zinc-200"}`}
                  >
                    {formatCurrency(totals.bank)}
                  </span>
                  {expandedSource === "bank" ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
              </button>
              {expandedSource === "bank" && currentBalances["Bank Account"] && (
                <div className="px-3.5 pb-3 pt-1 border-t border-zinc-850/50 space-y-2 bg-zinc-900/40">
                  {Object.entries(currentBalances["Bank Account"]).map(
                    ([bank, bal]) => (
                      <div
                        key={bank}
                        className="flex justify-between items-center text-xs py-1"
                      >
                        <span className="text-zinc-400 font-medium">
                          {bank}
                        </span>
                        <span
                          className={`font-bold ${bal < 0 ? "text-rose-500" : "text-zinc-200"}`}
                        >
                          {formatCurrency(bal)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* eWallets */}
            <div className="bg-zinc-950/40 border border-zinc-850/60 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSourceExpand("wallet")}
                className="w-full p-3.5 flex items-center justify-between outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Wallet className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-zinc-300">eWallets</p>
                    <p className="text-[10px] text-zinc-500">
                      eSewa, Khalti, IME Pay
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${totals.wallet < 0 ? "text-rose-500" : "text-zinc-200"}`}
                  >
                    {formatCurrency(totals.wallet)}
                  </span>
                  {expandedSource === "wallet" ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
              </button>
              {expandedSource === "wallet" && currentBalances["eWallet"] && (
                <div className="px-3.5 pb-3 pt-1 border-t border-zinc-850/50 space-y-2 bg-zinc-900/40">
                  {Object.entries(currentBalances["eWallet"]).map(
                    ([wallet, bal]) => (
                      <div
                        key={wallet}
                        className="flex justify-between items-center text-xs py-1"
                      >
                        <span className="text-zinc-400 font-medium">
                          {wallet}
                        </span>
                        <span
                          className={`font-bold ${bal < 0 ? "text-rose-500" : "text-zinc-200"}`}
                        >
                          {formatCurrency(bal)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* Mobile Banking */}
            <div className="bg-zinc-950/40 border border-zinc-850/60 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSourceExpand("mobile")}
                className="w-full p-3.5 flex items-center justify-between outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Smartphone className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-zinc-300">
                      Mobile Banking
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Instant app balances
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${totals.mobileBanking < 0 ? "text-rose-500" : "text-zinc-200"}`}
                  >
                    {formatCurrency(totals.mobileBanking)}
                  </span>
                  {expandedSource === "mobile" ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
              </button>
              {expandedSource === "mobile" &&
                currentBalances["Mobile Banking"] && (
                  <div className="px-3.5 pb-3 pt-1 border-t border-zinc-850/50 space-y-2 bg-zinc-900/40">
                    {Object.entries(currentBalances["Mobile Banking"]).map(
                      ([bank, bal]) => (
                        <div
                          key={bank}
                          className="flex justify-between items-center text-xs py-1"
                        >
                          <span className="text-zinc-400 font-medium">
                            {bank} App
                          </span>
                          <span
                            className={`font-bold ${bal < 0 ? "text-rose-500" : "text-zinc-200"}`}
                          >
                            {formatCurrency(bal)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
        {/* Right Columns: Insights & Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charts Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Expense Allocations (Pie Chart) */}
            <div className="finance-card">
              <h4 className="text-xs font-bold text-white tracking-tight uppercase border-b border-zinc-800/60 pb-3 mb-4">
                Expense Category Share
              </h4>
              <div className="h-48">
                {categoryChartData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-1.5">
                    <AlertCircle className="w-6 h-6 text-zinc-650" />
                    <p className="text-xs text-zinc-500 font-medium">
                      No expense records found.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="custom-chart-tooltip">
                                <span className="font-semibold text-zinc-300">
                                  {payload[0].name}:{" "}
                                </span>
                                <span className="font-bold text-emerald-400">
                                  {formatCurrency(payload[0].value)}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Pie Legends list */}
              {categoryChartData.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-zinc-850/50">
                  {categoryChartData.slice(0, 3).map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium truncate"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      ></span>
                      <span className="truncate">{entry.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Income vs Expenses Bar Chart */}
            <div className="finance-card">
              <h4 className="text-xs font-bold text-white tracking-tight uppercase border-b border-zinc-800/60 pb-3 mb-4">
                Monthly Spending Trends
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartData}>
                    <XAxis
                      dataKey="name"
                      stroke="#52525b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(39, 39, 42, 0.4)" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="custom-chart-tooltip space-y-1">
                              <p className="font-bold text-zinc-300 border-b border-zinc-850 pb-1 mb-1">
                                {payload[0].payload.name}
                              </p>
                              <p className="text-xs text-emerald-400 font-semibold">
                                Income: {formatCurrency(payload[0].value)}
                              </p>
                              <p className="text-xs text-rose-400 font-semibold">
                                Expense: {formatCurrency(payload[1].value)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="income"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expense"
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded"></span>
                  <span>Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded"></span>
                  <span>Expense</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Ledger Transactions */}
          <div className="finance-card">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-4">
              <h4 className="text-xs font-bold text-white tracking-tight uppercase">
                Recent Money Flow
              </h4>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                Latest records
              </span>
            </div>

            <div className="space-y-2.5">
              {recentTransactions.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center gap-2">
                  <AlertCircle className="w-7 h-7 text-zinc-650" />
                  <p className="text-xs text-zinc-500 font-medium">
                    No ledger entries found. Tap 'Add Flow' to start!
                  </p>
                </div>
              ) : (
                recentTransactions.map((tx) => {
                  const isIncome = tx.type === "income";
                  const catInfo = CATEGORIES[tx.category] || CATEGORIES.Others;
                  const CatIcon = catInfo.icon;

                  return (
                    <div
                      key={tx.id}
                      className="bg-zinc-950/40 border border-zinc-850/60 rounded-xl p-3.5 flex items-center justify-between group hover:border-zinc-800 transition-all"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Dynamic category icon background color */}
                        <div
                          className={`w-9.5 h-9.5 rounded-xl border flex items-center justify-center shrink-0 ${catInfo.bgClass}`}
                        >
                          <CatIcon className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-300 truncate">
                            {tx.notes || tx.category}
                          </p>
                          <p className="text-[9px] text-zinc-500 font-semibold uppercase mt-0.5 flex items-center gap-1 truncate">
                            <span>{formatDate(tx.date, dateSystem)}</span>
                            <span>•</span>
                            <span className="text-zinc-400">
                              {tx.paymentMethod}{" "}
                              {tx.provider && `(${tx.provider})`}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <span
                          className={`text-xs font-bold shrink-0 ${isIncome ? "text-emerald-400" : "text-zinc-300"}`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </span>

                        {/* Quick Delete */}
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Move this transaction to the Recycle Bin? You can restore it later from History.",
                              )
                            ) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          className="text-zinc-600 hover:text-rose-400 transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none"
                          aria-label="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Slide drawer for add flow */}
      <AddTransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        defaultType={defaultType}
        setActivePage={() => {}}
      />
    </div>
  );
}
