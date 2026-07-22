import { useState, useEffect, useCallback } from "react";
import {
  Users, TrendingUp, TrendingDown, Activity, DollarSign,
  CreditCard, ArrowUpRight, ArrowDownRight, RefreshCw,
  ShieldCheck, UserCheck, UserX, Search, Trash2, Ban,
  BarChart2, PieChart, Clock, Star, Loader2, Database, Mail, Key

} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../../../backend/db/firebase";
import {
  collection, collectionGroup, getDocs, doc, getDoc,
  query, orderBy, limit, where, Timestamp,onSnapshot 
} from "firebase/firestore";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useCalendar } from "../context/CalendarContext";
import { formatDate, formatMonth, formatCurrency } from "../utils/helpers";

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => formatCurrency(n, "INR");

const fmtNum = (n) => new Intl.NumberFormat("en-IN").format(n ?? 0);
const toDate = (value) => {
  if (!value) return null;
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

function StatCard({ icon: Icon, label, value, sub, color = "indigo", loading }) {
  const colors = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  };
  return (
    <div className="bg-zinc-900/70 backdrop-blur border border-zinc-800/60 rounded-2xl p-5 hover:border-zinc-700/60 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
      </div>
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-7 w-24 bg-zinc-800 rounded-lg" />
          <div className="h-4 w-16 bg-zinc-800/60 rounded" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-white font-['Outfit']">{value}</p>
          <p className="text-xs font-semibold text-zinc-500 mt-0.5 uppercase tracking-wider">{label}</p>
          {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
        </>
      )}
    </div>
  );
}

function SectionHeader({ title, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-indigo-400" />
      <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">{title}</h3>
    </div>
  );
}

const CHART_COLORS = ["#818cf8", "#34d399", "#f472b6", "#fb923c", "#a78bfa", "#38bdf8"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === "number" && p.value > 100 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
export default function Admin() {
  const { user } = useAuth();
  const { dateSystem } = useCalendar();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 8;

  // ── Real-time Data Listeners ────────────────────────────────────────────
  useEffect(() => {
    if (!db) return;
    setLoading(true);

    const unsubscribers = [];

    // Accumulated state built from snapshots
    let latestUsers = [];
    let txByUser = {}; // uid -> tx[]

    const recompute = () => {
      const allTx = Object.values(txByUser).flat().filter((tx) => !tx.deletedAt);
      allTx.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

      const userLookup = new Map(
        latestUsers.map((u) => [u.uid, {
          name: u.displayName || u.email || "Unknown User",
          email: u.email || ""
        }])
      );

      const enrichedTx = allTx.map((tx) => {
        const userInfo = userLookup.get(tx.uid) || { name: "Unknown User", email: "" };
        return {
          ...tx,
          userName: userInfo.name,
          userEmail: userInfo.email,
          description: tx.notes || tx.description || tx.title || "No note provided"
        };
      });

      const totalIncome = enrichedTx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
      const totalExpense = enrichedTx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const newUsersMonth = latestUsers.filter(u => {
        const joinedAt = toDate(u.createdAt);
        return joinedAt && joinedAt >= startOfMonth;
      }).length;
      const activeUsers = latestUsers.filter((u) => {
        const lastActiveAt = toDate(u.lastActiveAt);
        return !u.suspended && lastActiveAt && lastActiveAt >= last30;
      }).length;
      const recentTxList = enrichedTx.filter(t => {
        const d = t.date ? new Date(t.date) : null;
        return d && d >= last30;
      });

      const catMap = {};
      enrichedTx.filter(t => t.type === "expense").forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount || 0);
      });
      const categoryData = Object.entries(catMap)
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      const pmMap = {};
      allTx.forEach(t => {
        const key = t.paymentMethod || "Other";
        pmMap[key] = (pmMap[key] || 0) + 1;
      });
      const mostUsedPayment = Object.entries(pmMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
      const mostUsedCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

      const monthlyMap = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toISOString().slice(0, 7);
        monthlyMap[key] = { month: key, income: 0, expense: 0 };
      }
      enrichedTx.forEach(t => {
        const d = t.date ? new Date(t.date) : null;
        if (!d) return;
        const key = d.toISOString().slice(0, 7);
        if (monthlyMap[key]) {
          if (t.type === "income") monthlyMap[key].income += Number(t.amount || 0);
          else monthlyMap[key].expense += Number(t.amount || 0);
        }
      });
      const growthMap = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toISOString().slice(0, 7);
        growthMap[key] = { month: key, users: 0 };
      }
      latestUsers.forEach(u => {
        const d = toDate(u.createdAt);
        if (!d) return;
        const key = d.toISOString().slice(0, 7);
        if (growthMap[key]) growthMap[key].users += 1;
      });
      const monthlyTrend = Object.entries(monthlyMap)
        .map(([key, values]) => ({ ...values, monthLabel: formatMonth(`${key}-01`, dateSystem, true) }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const userGrowth = Object.values(growthMap).map((item) => ({
        ...item,
        monthLabel: formatMonth(`${item.month}-01`, dateSystem, true)
      }));

      setStats({
        totalUsers: latestUsers.length,
        activeUsers,
        newUsersMonth,
        totalTx: enrichedTx.length,
        totalIncome,
        totalExpense,
        totalSavings: totalIncome - totalExpense,
        recentTxCount: recentTxList.length,
        mostUsedPayment,
        mostUsedCategory,
        categoryData,
        monthlyTrend,
        userGrowth,
      });
      setUsers(latestUsers);
      setRecentTx(enrichedTx.slice(0, 20));
      setLoading(false);
      setRefreshing(false);
    };

    // 1. Listen to the users collection
    const usersUnsub = onSnapshot(collection(db, "users"), (snap) => {
      const userData = [];
      const currentUids = new Set();
      snap.forEach((d) => {
        userData.push({ uid: d.id, ...d.data() });
        currentUids.add(d.id);
      });
      latestUsers = userData;

      // Attach per-user transaction listeners for any new users
      userData.forEach((u) => {
        if (txByUser[u.uid] !== undefined) return; // already listening
        txByUser[u.uid] = [];
        const txQuery = query(
          collection(db, "users", u.uid, "transactions"),
          orderBy("date", "desc")
        );
        const txUnsub = onSnapshot(txQuery, (txSnap) => {
          const txList = [];
          txSnap.forEach((td) => txList.push({ id: td.id, uid: u.uid, ...td.data() }));
          txByUser[u.uid] = txList;
          recompute();
        }, (err) => {
          console.error(`Admin: tx listener error for ${u.uid}:`, err);
        });
        unsubscribers.push(txUnsub);
      });

      recompute();
    }, (err) => {
      console.error("Admin: users listener error:", err);
      setLoading(false);
    });
    unsubscribers.push(usersUnsub);

    return () => {
      unsubscribers.forEach(fn => fn());
    };
  }, [dateSystem]);

  // Manual refresh (just a visual indicator since data is already live)
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // ── User actions (local state only – wire to Firestore for production) ────
  const toggleSuspend = (uid) => {
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, suspended: !u.suspended } : u));
  };
  const removeUser = (uid) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    setUsers(prev => prev.filter(u => u.uid !== uid));
  };

  // ── Filtered / paginated users ────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    (u.displayName || u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
  );
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const pageUsers = filteredUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "users", label: "Users", icon: Users },
    { id: "transactions", label: "Transactions", icon: CreditCard },
    { id: "settings", label: "Settings", icon: Database },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-['Outfit']">Admin Dashboard</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Logged in as <span className="text-indigo-400">{user?.email}</span></p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 rounded-xl text-zinc-300 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-zinc-800/50 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
              activeTab === t.id
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════
          TAB: OVERVIEW
      ════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Stat Cards */}
          <div>
            <SectionHeader title="Key Metrics" icon={Activity} />
            {!loading && stats?.newUsersMonth > 0 && (
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-violet-500/25 bg-violet-500/10 px-4 py-3 text-violet-200">
                <span className="text-xl animate-bounce" aria-hidden="true">🎉</span>
                <p className="text-xs font-semibold"><span className="text-violet-300 font-bold">+{fmtNum(stats.newUsersMonth)}</span> new {stats.newUsersMonth === 1 ? "user has" : "users have"} joined this month.</p>
                <span className="ml-auto text-sm animate-pulse" aria-hidden="true">✨</span>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
              <StatCard icon={Users} label="Total Users" value={fmtNum(stats?.totalUsers)} color="indigo" loading={loading} />
              <StatCard icon={UserCheck} label="Active Users" value={fmtNum(stats?.activeUsers)} sub="active in the last 30 days" color="emerald" loading={loading} />
              <StatCard icon={Star} label="New This Month" value={fmtNum(stats?.newUsersMonth)} sub={stats?.newUsersMonth ? `+${fmtNum(stats.newUsersMonth)} joined` : "No new users yet"} color="violet" loading={loading} />
              <StatCard icon={CreditCard} label="Total Transactions" value={fmtNum(stats?.totalTx)} color="sky" loading={loading} />
              <StatCard icon={Clock} label="Last 30d Tx" value={fmtNum(stats?.recentTxCount)} color="amber" loading={loading} />
            </div>
          </div>

          <div>
            <SectionHeader title="Financial Summary" icon={DollarSign} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard icon={TrendingUp} label="Total Income" value={fmt(stats?.totalIncome)} color="emerald" loading={loading} />
              <StatCard icon={TrendingDown} label="Total Expenses" value={fmt(stats?.totalExpense)} color="rose" loading={loading} />
              <StatCard icon={DollarSign} label="Net Savings" value={fmt(stats?.totalSavings)} color="indigo" loading={loading} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/70 border border-zinc-800/60 rounded-2xl p-4">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Most Used Payment Method</p>
              <p className="text-xl font-bold text-white">{loading ? "—" : stats?.mostUsedPayment}</p>
            </div>
            <div className="bg-zinc-900/70 border border-zinc-800/60 rounded-2xl p-4">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Top Expense Category</p>
              <p className="text-xl font-bold text-white">{loading ? "—" : stats?.mostUsedCategory}</p>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income vs Expense Trend */}
            <div className="bg-zinc-900/70 border border-zinc-800/60 rounded-2xl p-5">
              <SectionHeader title="Income vs Expense (6 months)" icon={BarChart2} />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats?.monthlyTrend || []} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
                  <Bar dataKey="income" name="Income" fill="#34d399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* User Growth */}
            <div className="bg-zinc-900/70 border border-zinc-800/60 rounded-2xl p-5">
              <SectionHeader title="User Growth (6 months)" icon={TrendingUp} />
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats?.userGrowth || []}>
                  <defs>
                    <linearGradient id="ugGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="users" name="New Users" stroke="#818cf8" fill="url(#ugGrad)" strokeWidth={2} dot={{ r: 3, fill: "#818cf8" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Pie */}
          {(stats?.categoryData?.length > 0) && (
            <div className="bg-zinc-900/70 border border-zinc-800/60 rounded-2xl p-5">
              <SectionHeader title="Expense Category Distribution" icon={PieChart} />
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={220}>
                  <RechartPie>
                    <Pie data={stats.categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                      {stats.categoryData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartPie>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {stats.categoryData.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {c.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div className="bg-zinc-900/70 border border-zinc-800/60 rounded-2xl p-5">
            <SectionHeader title="Recent Transactions (Platform-wide)" icon={CreditCard} />
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-zinc-800/60 rounded-lg" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="pb-2 text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider">User</th>
                      <th className="pb-2 text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider">Description</th>
                      <th className="pb-2 text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider">Category</th>
                      <th className="pb-2 text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider">Method</th>
                      <th className="pb-2 text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider">Amount</th>
                      <th className="pb-2 text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {recentTx.map((tx) => (
                      <tr key={tx.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-2.5 text-zinc-200 font-medium">
                          <div className="flex flex-col">
                            <span>{tx.userName || "Unknown User"}</span>
                            {tx.userEmail ? <span className="text-[10px] text-zinc-500">{tx.userEmail}</span> : null}
                          </div>
                        </td>
                        <td className="py-2.5 text-zinc-200 font-medium max-w-[240px]">
                          <div className="line-clamp-2">{tx.description || "—"}</div>
                        </td>
                        <td className="py-2.5 text-zinc-400 text-xs">{tx.category || "—"}</td>
                        <td className="py-2.5 text-zinc-400 text-xs">{tx.paymentMethod || "—"}</td>
                        <td className={`py-2.5 text-right font-bold text-xs ${tx.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                          {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                        </td>
                        <td className="py-2.5 text-right text-zinc-500 text-xs">{tx.date ? formatDate(tx.date, dateSystem) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: USERS
      ════════════════════════════════════════════════════ */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
                className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <span className="text-xs text-zinc-500 font-medium">{filteredUsers.length} users found</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/60">
                  {["User", "Email", "Role", "Status", "Joined", "Actions"].map(h => (
                    <th key={h} className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((__, j) => (
                        <td key={j} className="p-4"><div className="h-5 bg-zinc-800/60 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : pageUsers.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-zinc-500 text-sm">No users found.</td></tr>
                ) : (
                  pageUsers.map(u => (
                    <tr key={u.uid} className={`hover:bg-zinc-900/40 transition-colors ${u.suspended ? "opacity-50" : ""}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300">
                            {(u.displayName || u.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <p className="text-sm font-semibold text-zinc-200">{u.displayName || "—"}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        {u.email ? (
                          <a
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(u.email)}&su=${encodeURIComponent("Welcome to KharchaFlow! 🎉")}&body=${encodeURIComponent(`Hi ${u.displayName || "there"},\n\nWelcome to KharchaFlow! 🎉\n\nWe're thrilled to have you on board. KharchaFlow is your smart personal finance companion — track your income, manage expenses, and gain insights that help you take control of your money.\n\nHere's what you can do:\n• 📊 Track income & expenses in real time\n• 📈 Visualize your spending with beautiful charts\n• 💡 Get smart financial insights\n• 🔒 Enjoy secure, private data management\n\nIf you ever need help, just reply to this email — we're always happy to assist!\n\nHappy budgeting! 💸\n\nWarm regards,\nThe KharchaFlow Team`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Send welcome email to ${u.email}`}
                            className="group flex items-center gap-1.5 text-xs text-zinc-400 hover:text-indigo-400 transition-colors duration-150"
                          >
                            <Mail className="w-3 h-3 text-zinc-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                            <span className="underline underline-offset-2 decoration-dotted decoration-zinc-600 group-hover:decoration-indigo-400">{u.email}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${u.isAdmin ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-zinc-800/60 text-zinc-400 border-zinc-700/50"}`}>
                          {u.isAdmin ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${u.suspended ? "bg-rose-500" : "bg-emerald-500"}`} />
                          <span className="text-xs text-zinc-400">{u.suspended ? "Suspended" : "Active"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-zinc-500">
                        {u.createdAt
                          ? formatDate((u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt)).toISOString().slice(0, 10), dateSystem)
                          : "—"}
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => toggleSuspend(u.uid)}
                          disabled={u.isAdmin}
                          className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title={u.suspended ? "Activate" : "Suspend"}
                        >
                          {u.suspended ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => removeUser(u.uid)}
                          disabled={u.isAdmin}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Showing {(userPage - 1) * USERS_PER_PAGE + 1}–{Math.min(userPage * USERS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length}</span>
              <div className="flex gap-2">
                <button disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/60 disabled:opacity-40 transition-colors">Prev</button>
                <button disabled={userPage === totalPages} onClick={() => setUserPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/60 disabled:opacity-40 transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: TRANSACTIONS
      ════════════════════════════════════════════════════ */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          <SectionHeader title="All Platform Transactions" icon={CreditCard} />
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-zinc-800/50 rounded-xl" />)}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-800/60 bg-zinc-900/40">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60">
                    {["Type", "User", "Description", "Category", "Method", "Amount", "Date"].map(h => (
                      <th key={h} className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {recentTx.map(tx => (
                    <tr key={tx.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${tx.type === "income" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-zinc-200 font-medium">
                        <div className="flex flex-col">
                          <span>{tx.userName || "Unknown User"}</span>
                          {tx.userEmail ? <span className="text-[10px] text-zinc-500">{tx.userEmail}</span> : null}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-zinc-200 font-medium max-w-[260px]">
                        <div className="line-clamp-2">{tx.description || "—"}</div>
                      </td>
                      <td className="p-4 text-xs text-zinc-400">{tx.category || "—"}</td>
                      <td className="p-4 text-xs text-zinc-400">{tx.paymentMethod || "—"}</td>
                      <td className={`p-4 text-sm font-bold ${tx.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                        {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                      </td>
                      <td className="p-4 text-xs text-zinc-500">{tx.date ? formatDate(tx.date, dateSystem) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: SETTINGS
      ════════════════════════════════════════════════════ */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: Database, title: "Database Rules", desc: "Configure global database access policies and read/write throughput limits." },
            { icon: Key, title: "API Integrations", desc: "Manage OAuth providers, Google Auth keys, and external service Webhooks." },
            { icon: Activity, title: "Audit Logs", desc: "Review system-wide security logs, failed login attempts, and suspicious activity." },
            { icon: Mail, title: "System Broadcasts", desc: "Send global announcements and alerts to all registered user dashboards." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-zinc-900/70 border border-zinc-800/60 rounded-2xl p-5 flex flex-col gap-3 hover:border-zinc-700/60 transition-all">
              <div className="flex items-center gap-3 border-b border-zinc-800/50 pb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">{title}</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed flex-1">{desc}</p>
              <button className="mt-auto py-2 text-xs font-bold border border-zinc-700 rounded-xl text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all">
                Configure →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
