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
import { TrendingUp } from "lucide-react";


function AppContent() {
  const { user, loading } = useAuth();
  const { loading: financeLoading } = useFinance();
  const [activePage, setActivePage] = useState("dashboard");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Route protection
  useEffect(() => {
    if (user && !user.isAdmin && activePage === "admin") {
      setActivePage("dashboard");
    }
  }, [activePage, user]);

  // Initialize and apply theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("kharchaflow_theme");
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Premium loading screen during app boot up
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 relative overflow-hidden bg-mesh-grid">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-2 animate-bounce">
          <TrendingUp className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-zinc-500 tracking-wider uppercase">Loading Finances...</p>
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
      />
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
