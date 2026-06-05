import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  Settings,
  ShieldAlert,
  LogOut,
  Plus
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function BottomNav({ activePage, setActivePage, onQuickAddClick }) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "history", label: "History", icon: Receipt },
    { id: "placeholder", label: "", icon: null }, // Spacer for FAB
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    ...(user?.isAdmin ? [
      { id: "settings", label: "Settings", icon: Settings },
      { id: "admin", label: "Admin", icon: ShieldAlert }
    ] : [
      { id: "logout", label: "Log Out", icon: LogOut, action: "logout" }
    ])
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-zinc-900 border-t border-zinc-800/80 md:hidden z-30 h-16.5 pb-safe">
      <div 
        className="relative h-full grid max-w-md mx-auto items-center px-2"
        style={{ gridTemplateColumns: `repeat(${menuItems.length}, minmax(0, 1fr))` }}
      >
        {menuItems.map((item) => {
          if (item.id === "placeholder") {
            return (
              <div key="placeholder-fab" className="flex items-center justify-center -translate-y-4">
                <button
                  onClick={onQuickAddClick}
                  className="w-12.5 h-12.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all duration-150"
                  aria-label="Quick Add Transaction"
                >
                  <Plus className="w-6.5 h-6.5 stroke-[2.5]" />
                </button>
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => item.action === "logout" ? logout() : setActivePage(item.id)}
              className="flex flex-col items-center justify-center gap-1 h-full py-1 text-center"
            >
              <Icon className={`w-5 h-5 transition-all ${
                isActive 
                  ? "text-emerald-400 stroke-[2.2]" 
                  : "text-zinc-500 hover:text-zinc-300 stroke-[1.8]"
              }`} />
              <span className={`text-[10px] font-medium transition-all ${
                isActive ? "text-emerald-400 font-semibold" : "text-zinc-500"
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
