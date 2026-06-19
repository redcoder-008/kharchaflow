import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  Settings,
  ShieldAlert,
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
    { id: "settings", label: "Settings", icon: Settings },
    ...(user?.isAdmin ? [
      { id: "admin", label: "Admin", icon: ShieldAlert }
    ] : [])
  ];

  return (
    /*
     * The nav uses a fixed height via --bottom-nav-h (defined in index.css).
     * pb-safe adds env(safe-area-inset-bottom) so the bar clears the home indicator
     * on notch/gesture-bar devices (Android & iOS).
     */
    <nav
      className="fixed bottom-0 inset-x-0 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800/80 md:hidden z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        className="relative h-16 grid max-w-md mx-auto items-center px-2"
        style={{ gridTemplateColumns: `repeat(${menuItems.length}, minmax(0, 1fr))` }}
      >
        {menuItems.map((item) => {
          if (item.id === "placeholder") {
            return (
              // FAB sits above the nav: lifted by (half FAB height + half nav height) = (28 + 32) = 60px
              <div key="placeholder-fab" className="flex items-center justify-center" style={{ marginTop: '-60px' }}>
                <button
                  onClick={onQuickAddClick}
                  className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center shadow-[0_4px_24px_rgba(16,185,129,0.45)] active:scale-90 transition-all duration-150 border-4 border-zinc-900"
                  aria-label="Quick Add Transaction"
                >
                  <Plus className="w-7 h-7 stroke-[2.8]" />
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
              className="flex flex-col items-center justify-center gap-0.5 h-full py-2 text-center"
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
