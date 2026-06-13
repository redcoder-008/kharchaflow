import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FinanceProvider, useFinance } from "./context/FinanceContext";
import Sidebar from "./components/layouts/Sidebar";
import BottomNav from "./components/layouts/BottomNav";
import Header from "./components/layouts/Header";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import AddTransactionModal from "./components/transactions/AddTransactionModal";
  import { TrendingUp, Download, X } from "lucide-react";


function AppContent() {
  const { user, loading } = useAuth();
  const { loading: financeLoading } = useFinance();
  const [activePage, setActivePage] = useState("dashboard");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [showApkBanner, setShowApkBanner] = useState(true);

  // Route protection
  useEffect(() => {
    if (user && !user.isAdmin && activePage === "admin") {
      setActivePage("dashboard");
    }
  }, [activePage, user]);

  // Initialize and apply theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("kharchaflow_theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Globally prevent number inputs from changing value on scroll
  useEffect(() => {
    const handleWheel = (e) => {
      if (document.activeElement && document.activeElement.type === "number") {
        document.activeElement.blur();
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // Premium loading screen during app boot up
  if (loading) {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6 relative overflow-hidden bg-mesh-grid">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-2 animate-bounce">
            <TrendingUp className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-zinc-500 tracking-wider uppercase">Loading Finances...</p>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 flex flex-col items-center animate-fade-in">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-200">Your money. Your rules.</h1>
            <p className="mt-1 text-sm text-zinc-300">Your KharchaFlow.</p>
          </div>
        </div>
    );
  }

  // Auth routing: redirect to Auth Page if not authenticated
  if (!user) {
    return <Auth />;
  }

  // Render Page Content dynamically based on state routing
  const renderPage = () => {
    if (financeLoading) {
      return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-zinc-500 tracking-wider uppercase">Loading database records...</span>
        </div>
      );
    }

    switch (activePage) {
      case "dashboard":
        return <Dashboard />;
      case "history":
        return <History />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return <Settings />;
      case "admin":
        return user?.isAdmin ? <Admin /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex md:pl-64 text-zinc-100 bg-mesh-grid relative">
      
      {/* Decorative Grid Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

      {/* Desktop Sidebar navigation */}
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Main content pane */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        
        {/* Sticky top header bar */}
        <Header activePage={activePage} setActivePage={setActivePage} />

        {/* Scrollable primary route wrapper */}
        <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {renderPage()}
        </main>
      </div>

      {/* Mobile bottom navigation bar with quick add slot */}
      <BottomNav 
        activePage={activePage} 
        setActivePage={setActivePage} 
        onQuickAddClick={() => setIsQuickAddOpen(true)} 
      />

      {/* Sliding Quick Add Modal drawer */}
      <AddTransactionModal 
        isOpen={isQuickAddOpen} 
        onClose={() => setIsQuickAddOpen(false)} 
        setActivePage={setActivePage}
      />

      {/* Download APK Floating Banner (Mobile Only) */}
      {showApkBanner && (
        <div className="md:hidden fixed bottom-24 right-4 z-50 flex items-center bg-zinc-900 border border-emerald-500/30 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.2)] p-1 animate-slide-up backdrop-blur-md">
          <button 
            onClick={() => {
              const a = document.createElement("a");
              a.href = "/app-debug.apk";
              a.download = "KharchaFlow.apk";
              a.click();
            }}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-emerald-500/10 rounded-full transition-colors outline-none group"
          >
            <div className="w-6 h-6 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-full flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform">
              <Download className="w-3.5 h-3.5" />
            </div>
            <div className="text-left pr-1">
              <p className="text-[11px] font-bold text-zinc-200 leading-none">Install APK</p>
            </div>
          </button>
          <div className="w-px h-5 bg-zinc-800 mx-0.5"></div>
          <button 
            onClick={() => setShowApkBanner(false)}
            className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-full transition-colors outline-none mr-0.5"
            aria-label="Close banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <AppContent />
      </FinanceProvider>
    </AuthProvider>
  );
}
