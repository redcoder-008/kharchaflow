import { useState } from "react";
import { 
  CloudLightning, 
  TrendingUp, 
  RefreshCw, 
  WifiOff,
  Bell,
  CheckCheck,
  BellRing
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useFinance } from "../../context/FinanceContext";
import UserAvatar from "../ui/UserAvatar";
import { useNotifications } from "../../context/NotificationContext";

export default function Header({ activePage, setActivePage }) {
  const { user, isDemoMode } = useAuth();
  const { syncStatus } = useFinance();
  const { notifications, unreadCount, markAsRead, markAllAsRead, enablePush, pushStatus } = useNotifications();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const getPageTitle = () => {
    switch (activePage) {
      case "dashboard":
        return "Dashboard";
      case "history":
        return "Transaction History";
      case "analytics":
        return "Insights & Analytics";
      case "goals":
        return "Financial Goals";
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

            <div className="relative">
              <button onClick={() => setIsNotificationOpen((open) => !open)} className="relative p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300 hover:text-emerald-400 transition-colors" aria-label="Open notifications">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[9px] leading-4 text-white font-bold">{unreadCount > 99 ? "99+" : unreadCount}</span>}
              </button>
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] max-h-[28rem] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                    <div><p className="text-sm font-bold text-white">Notifications</p><p className="text-[10px] text-zinc-500">{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</p></div>
                    {unreadCount > 0 && <button onClick={markAllAsRead} className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex gap-1 items-center"><CheckCheck className="w-3.5 h-3.5" /> Read all</button>}
                  </div>
                  {notifications.length === 0 ? <p className="px-4 py-8 text-center text-xs text-zinc-500">No notifications yet.</p> : notifications.slice(0, 30).map((notification) => (
                    <button key={notification.id} onClick={() => markAsRead(notification.id)} className={`w-full text-left px-4 py-3 border-b border-zinc-900 hover:bg-zinc-900/70 transition-colors ${notification.read ? "" : "bg-emerald-500/5"}`}>
                      <div className="flex gap-2"><span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${notification.read ? "bg-transparent" : "bg-emerald-400"}`} /><div><p className="text-xs font-bold text-zinc-200">{notification.title}</p><p className="mt-0.5 text-[11px] text-zinc-500 leading-relaxed">{notification.body}</p><p className="mt-1 text-[9px] text-zinc-600">{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : "Just now"}</p></div></div>
                    </button>
                  ))}
                  {!isDemoMode && <div className="p-3"><button onClick={async () => { try { await enablePush(); } catch (error) { console.error(error); } }} className="w-full px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 flex items-center justify-center gap-2"><BellRing className="w-3.5 h-3.5 text-emerald-400" /> {pushStatus === "granted" ? "Push notifications enabled" : "Enable push notifications"}</button></div>}
                </div>
              )}
            </div>

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
