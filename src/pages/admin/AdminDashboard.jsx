import React from "react";
import AdminLayout from "../../layouts/AdminLayout";
import StatCard from "../../components/admin/StatCard";
import { Users, DollarSign, CreditCard, ArrowUpRight, TrendingUp, PieChart } from "lucide-react";

// Placeholder admin dashboard – replace with real data fetching later.
export default function AdminDashboard() {
  // Dummy data – in real implementation use hooks to fetch from Firestore.
  const stats = [
    { title: "Total Users", value: "1,224", icon: Users },
    { title: "Active Users (Today)", value: "342", icon: ArrowUpRight },
    { title: "Active Users (7 Days)", value: "2,108", icon: ArrowUpRight },
    { title: "Active Users (30 Days)", value: "5,743", icon: ArrowUpRight },
    { title: "New Users This Month", value: "87", icon: Users },
    { title: "Total Transactions", value: "9,842", icon: CreditCard },
    { title: "Total Income Recorded", value: "$124,560", icon: DollarSign },
    { title: "Total Expenses Recorded", value: "$98,340", icon: DollarSign },
    { title: "Total Savings", value: "$26,220", icon: TrendingUp },
    { title: "Most Used Payment Method", value: "Credit Card", icon: CreditCard },
    { title: "Most Used Expense Category", value: "Food & Dining", icon: PieChart },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Statistic cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatCard key={s.title} title={s.title} value={s.value} icon={s.icon} loading={false} />
          ))}
        </div>
        {/* Placeholder for charts – real charts will be added later */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-zinc-900/60 rounded-lg border border-zinc-800/50 flex items-center justify-center text-zinc-500">
            <span className="text-sm">User Growth Chart (coming soon)</span>
          </div>
          <div className="h-64 bg-zinc-900/60 rounded-lg border border-zinc-800/50 flex items-center justify-center text-zinc-500">
            <span className="text-sm">Income vs Expense Chart (coming soon)</span>
          </div>
          <div className="h-64 bg-zinc-900/60 rounded-lg border border-zinc-800/50 flex items-center justify-center text-zinc-500 col-span-2">
            <span className="text-sm">Category Distribution Chart (coming soon)</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
