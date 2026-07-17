import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  Settings, 
  ShieldAlert,
  LogOut,
  TrendingUp,
  Cloud,
  UserCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import UserAvatar from "../ui/UserAvatar";

export default function Sidebar({ activePage, setActivePage }) {
  const { user, logout, isDemoMode } = useAuth();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "history", label: "History", icon: Receipt },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
    ...(user?.isAdmin ? [
      { id: "admin", label: "Admin", icon: ShieldAlert }
    ] : [])
  ];

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 bg-zinc-900 border-r border-zinc-800/80 md:flex flex-col z-30">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-zinc-800/50 gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
          <TrendingUp className="w-5.5 h-5.5 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white leading-none">KharchaFlow</h1>
          <span className="text-xs text-zinc-400 font-medium">Track money effortlessly.</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" 
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.2]" : "stroke-[1.8]"}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer / Profile block */}
      <div className="p-4 border-t border-zinc-800/50">
        {user && (
          <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-2xl p-4.5 mb-3 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <UserAvatar user={user} size="w-10 h-10" textSize="text-sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-200 truncate leading-none mb-1">
                  {user.displayName || "Fintech User"}
                </p>
                <p className="text-xs text-zinc-500 truncate">{user.isAnonymous ? "Guest session" : user.email}</p>
              </div>
            </div>

            {/* Account Status Badge */}
            <div className="flex items-center justify-between border-t border-zinc-800/50 pt-2.5 mt-0.5">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Sync Type</span>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold leading-none ${
                isDemoMode 
                  ? "bg-zinc-800 text-zinc-400" 
                  : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10"
              }`}>
                {isDemoMode ? (
                  <>
                    <UserCheck className="w-3 h-3" />
                    Offline Demo
                  </>
                ) : (
                  <>
                    <Cloud className="w-3 h-3" />
                    Cloud Sync
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Logout Action */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-rose-400/90 hover:bg-rose-500/5 hover:text-rose-400 border border-transparent hover:border-rose-500/10 transition-all duration-150"
        >
          <LogOut className="w-5 h-5 stroke-[1.8]" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
