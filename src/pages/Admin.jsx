import React, { useState } from "react";
import { Users, Settings as ConfigIcon, ShieldAlert, Key, Database, Activity, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("users");

  // Mock data now handled inside UserManagement component SDK doesn't support listing users
  const mockUsers = [
    { id: "1", email: user?.email || "admin@example.com", name: user?.displayName || "Admin User", role: "Admin", lastActive: "Just now", status: "Active" },
    { id: "2", email: "john.doe@example.com", name: "John Doe", role: "User", lastActive: "2 hours ago", status: "Active" },
    { id: "3", email: "sarah.smith@example.com", name: "Sarah Smith", role: "User", lastActive: "1 day ago", status: "Inactive" },
    { id: "4", email: "michael.b@example.com", name: "Michael B", role: "User", lastActive: "5 mins ago", status: "Active" },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-4 border-b border-zinc-800/60 pb-5">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Security & Administration</h2>
          <p className="text-xs font-medium text-zinc-400 mt-1">Manage platform settings, user roles, and security policies.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800/50 pb-px">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 ${activeTab === "users" ? "border-indigo-500 text-indigo-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            User Management
          </div>
        </button>
        <button
          onClick={() => setActiveTab("system")}
          className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 ${activeTab === "system" ? "border-indigo-500 text-indigo-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
        >
          <div className="flex items-center gap-2">
            <ConfigIcon className="w-4 h-4" />
            System Configuration
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab === "users" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Registered Accounts</h3>
              <button className="px-3 py-1.5 text-xs font-bold bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-all border border-indigo-500/20">
                Invite User
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-zinc-800/60 bg-zinc-950/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800/60 bg-zinc-900/40">
                    <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">User</th>
                    <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Role</th>
                    <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Last Active</th>
                    <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {mockUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-200">{u.name}</p>
                            <p className="text-xs text-zinc-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md border ${u.role === "Admin" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-zinc-800/50 text-zinc-400 border-zinc-700/50"}`}>{u.role}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === "Active" ? "bg-emerald-500" : "bg-zinc-600"}`} />
                          <span className="text-xs font-medium text-zinc-300">{u.status}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-zinc-400 font-medium">{u.lastActive}</td>
                      <td className="p-4 text-right space-x-2">
                        <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-500/10 transition-colors">Edit</button>
                        {u.role !== "Admin" && (
                          <button className="text-xs font-semibold text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10 transition-colors">Suspend</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="finance-card flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-zinc-800/50 pb-3">
                <Database className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Database Rules</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">Configure global database access policies and read/write throughput limits.</p>
              <button className="mt-auto py-2 text-xs font-bold border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors w-full text-center">Review Policies</button>
            </div>
            <div className="finance-card flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-zinc-800/50 pb-3">
                <Key className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">API Integrations</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">Manage OAuth providers, Google Auth keys, and external service Webhooks.</p>
              <button className="mt-auto py-2 text-xs font-bold border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors w-full text-center">Manage Keys</button>
            </div>
            <div className="finance-card flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-zinc-800/50 pb-3">
                <Activity className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Audit Logs</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">Review system-wide security logs, failed login attempts, and suspicious activity.</p>
              <button className="mt-auto py-2 text-xs font-bold border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors w-full text-center">View Logs</button>
            </div>
            <div className="finance-card flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-zinc-800/50 pb-3">
                <Mail className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">System Broadcasts</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">Send global announcements and alerts to all registered user dashboards.</p>
              <button className="mt-auto py-2 text-xs font-bold border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors w-full text-center">New Broadcast</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
