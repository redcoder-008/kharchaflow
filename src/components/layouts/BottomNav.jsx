import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  Settings,
  Plus
} from "lucide-react";

export default function BottomNav({ activePage, setActivePage, onQuickAddClick }) {
  const menuItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "history", label: "History", icon: Receipt },
    { id: "placeholder", label: "", icon: null }, // Spacer for FAB
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-zinc-900 border-t border-zinc-800/80 md:hidden z-30 h-16.5 pb-safe">
      <div className="relative h-full grid grid-cols-5 max-w-md mx-auto items-center px-2">
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
              onClick={() => setActivePage(item.id)}
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
