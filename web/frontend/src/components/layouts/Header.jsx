import { 
  CloudLightning, 
  TrendingUp, 
  RefreshCw, 
  WifiOff 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useFinance } from "../../context/FinanceContext";
import UserAvatar from "../ui/UserAvatar";

export default function Header({ activePage, setActivePage }) {
  const { user, isDemoMode } = useAuth();
  const { syncStatus } = useFinance();

  const getPageTitle = () => {
    switch (activePage) {
      case "dashboard":
        return "Dashboard";
      case "history":
        return "Transaction History";
      case "analytics":
        return "Insights & Analytics";
      case "settings":
        return "App Settings";
      case "admin":
        return "Admin Dashboard";
      default:
        return "KharchaFlow";
    }
  };

  return (
    <header className="sticky top-0 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 z-20 w-full">
      {/* Demo Mode Alert Banner */}
      {isDemoMode && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/10 py-2 px-4 md:px-8 text-center flex items-center justify-center gap-2">
          <CloudLightning className="w-4 h-4 text-emerald-400 stroke-[2]" />
          <p className="text-xs font-medium text-emerald-300">
            Offline Demo Mode. Connect your own Firebase database in{" "}
            <button 
              onClick={() => setActivePage("settings")} 
              className="underline font-semibold text-emerald-400 hover:text-emerald-300"
            >
              settings
            </button>{" "}
            to sync data across devices.
          </p>
        </div>
      )}

      {/* Main Header Row */}
      <div className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between">
        {/* Mobile Left Section: Mini Brand Icon & Title */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <span className="font-bold text-white tracking-tight">KharchaFlow</span>
        </div>

        {/* Desktop Left Section: Page Title */}
        <div className="hidden md:block">
          <h2 className="text-2xl font-bold tracking-tight text-white">{getPageTitle()}</h2>
          <p className="text-xs text-zinc-400 font-normal mt-0.5">Welcome back to your financial control center.</p>
        </div>

        {/* Right Section: User Profile & Quick Actions */}
        {user && (
          <div className="flex items-center gap-3">
            {/* Sync Status Indicator */}
            {!isDemoMode && syncStatus && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/50">
                {syncStatus === "synced" && (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hidden md:inline-block">Synced</span>
                  </>
                )}
                {syncStatus === "pending" && (
                  <>
                    <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest hidden md:inline-block">Syncing</span>
                  </>
                )}
                {syncStatus === "offline" && (
                  <>
                    <WifiOff className="w-3 h-3 text-rose-500" />
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hidden md:inline-block">Offline</span>
                  </>
                )}
              </div>
            )}

            {/* User Profile Avatar */}
            <button
              onClick={() => setActivePage("settings")}
              className="flex items-center gap-2.5 p-1 bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-full md:rounded-xl md:px-3 md:py-1.5 transition-all outline-none"
            >
              <UserAvatar user={user} size="w-7 h-7" textSize="text-xs" />
              <span className="hidden md:block text-xs font-semibold text-zinc-300 max-w-28 truncate">
                {user.displayName ? user.displayName.split(" ")[0] : "User"}
              </span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
