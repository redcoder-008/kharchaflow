import React, { useState } from "react";
import { Users, Edit, Trash2, Ban, CheckCircle, XCircle } from "lucide-react";

// Mock user data – replace with real API call later
const mockUsers = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", role: "User", status: "Active", lastActive: "2h ago" },
  { id: "2", name: "Bob Smith", email: "bob@example.com", role: "User", status: "Suspended", lastActive: "1d ago" },
  { id: "3", name: "Charlie Brown", email: "charlie@example.com", role: "Admin", status: "Active", lastActive: "Just now" },
];

export default function UserManagement() {
  const [users, setUsers] = useState(mockUsers);

  const toggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" }
          : u
      )
    );
  };

  const deleteUser = (id) => {
    if (window.confirm("Delete this user permanently?")) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">User Management</h2>
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/30 backdrop-blur-sm">
        <table className="min-w-full divide-y divide-zinc-800 text-sm">
          <thead className="bg-zinc-900/60">
            <tr>
              <th className="p-3 text-left text-xs font-medium text-zinc-400 uppercase">Name</th>
              <th className="p-3 text-left text-xs font-medium text-zinc-400 uppercase">Email</th>
              <th className="p-3 text-left text-xs font-medium text-zinc-400 uppercase">Role</th>
              <th className="p-3 text-left text-xs font-medium text-zinc-400 uppercase">Status</th>
              <th className="p-3 text-left text-xs font-medium text-zinc-400 uppercase">Last Active</th>
              <th className="p-3 text-right text-xs font-medium text-zinc-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-900/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span className="text-zinc-200">{u.name}</span>
                  </div>
                </td>
                <td className="p-3 text-zinc-400">{u.email}</td>
                <td className="p-3 text-zinc-400">{u.role}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      u.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="p-3 text-zinc-400">{u.lastActive}</td>
                <td className="p-3 text-right space-x-2">
                  <button
                    className="p-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleStatus(u.id)}
                    className="p-1 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded transition-colors"
                    title={u.status === "Active" ? "Suspend" : "Activate"}
                  >
                    {u.status === "Active" ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteUser(u.id)}
                    className="p-1 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
