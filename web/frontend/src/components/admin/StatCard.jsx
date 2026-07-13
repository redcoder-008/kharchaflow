import React from "react";
import { Users, DollarSign, ArrowUpRight, TrendingUp, PieChart, Calendar, CreditCard } from "lucide-react";

export default function StatCard({ title, value, icon: Icon, loading }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-4 flex items-center gap-3 hover:border-zinc-700 transition-colors">
      <div className="p-2 bg-indigo-500/10 rounded-md border border-indigo-500/20 text-indigo-400">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {title}
        </p>
        {loading ? (
          <div className="h-5 w-24 bg-zinc-800 rounded animate-pulse" />
        ) : (
          <p className="text-lg font-bold text-white truncate">{value}</p>
        )}
      </div>
    </div>
  );
}
