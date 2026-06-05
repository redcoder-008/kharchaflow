import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { reloadFirebaseApp } from "../db/firebase";
import { localDB } from "../db/storage";
import { 
  User, 
  Cloud, 
  Moon, 
  Sun, 
  Save, 
  Sliders, 
  LogOut,
  RefreshCw,
  CheckCircle,
  HelpCircle
} from "lucide-react";

export default function Settings() {
  const { user, isDemoMode, logout, updateProfileName } = useAuth();
  const { budgets, updateBudget } = useFinance();

  // Profile fields
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Budgets state fields
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [budgetSuccess, setBudgetSuccess] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);

  // Theme state fields
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark") || !localStorage.getItem("kharchaflow_theme");
  });

  // Firebase Config State
  const [apiKey, setApiKey] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [projectId, setProjectId] = useState("");
  const [storageBucket, setStorageBucket] = useState("");
  const [messagingSenderId, setMessagingSenderId] = useState("");
  const [appId, setAppId] = useState("");
  const [configSuccess, setConfigSuccess] = useState(false);

  // Sync initial values
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [user]);

  useEffect(() => {
    if (budgets) {
      setCategoryBudgets(budgets);
    }
  }, [budgets]);

  // Load existing Firebase keys if present
  useEffect(() => {
    const config = localDB.getFirebaseConfig();
    if (config) {
      setApiKey(config.apiKey || "");
      setAuthDomain(config.authDomain || "");
      setProjectId(config.projectId || "");
      setStorageBucket(config.storageBucket || "");
      setMessagingSenderId(config.messagingSenderId || "");
      setAppId(config.appId || "");
    }
  }, []);

  // Theme handler
  const handleThemeToggle = () => {
    const nextThemeDark = !isDarkMode;
    setIsDarkMode(nextThemeDark);
    if (nextThemeDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("kharchaflow_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("kharchaflow_theme", "light");
    }
  };

  // Profile Save
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);
    
    if (!displayName.trim()) {
      setProfileError("Name cannot be left blank.");
      return;
    }

    setProfileSaving(true);
    try {
      await updateProfileName(displayName.trim());
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setProfileError("Failed to update profile name.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Budgets Save
  const handleBudgetChange = (cat, val) => {
    setCategoryBudgets((prev) => ({ ...prev, [cat]: val }));
  };

  const handleBudgetsSave = async (e) => {
    e.preventDefault();
    setBudgetSuccess(false);
    setBudgetSaving(true);
    
    try {
      // Save all budgets in loop
      const promises = Object.entries(categoryBudgets).map(([cat, val]) => 
        updateBudget(cat, Number(val) || 0)
      );
      await Promise.all(promises);
      setBudgetSuccess(true);
      setTimeout(() => setBudgetSuccess(false), 3000);
    } catch (err) {
      console.error("Budget save error: ", err);
    } finally {
      setBudgetSaving(false);
    }
  };

  // Firebase Config Save & Restart
  const handleFirebaseConfigSave = (e) => {
    e.preventDefault();
    setConfigSuccess(false);

    if (!apiKey.trim() || !projectId.trim()) {
      alert("API Key and Project ID are minimum fields required for database sync.");
      return;
    }

    const configObj = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    };

    localDB.saveFirebaseConfig(configObj);
    localDB.setIsDemoMode(false);
    setConfigSuccess(true);

    setTimeout(() => {
      // Re-initializes Vite App with active keys
      reloadFirebaseApp(configObj);
    }, 1000);
  };

  const handleResetToDemo = () => {
    if (confirm("Disconnecting your database keys will switch you back to offline LocalStorage mode. Continue?")) {
      localDB.saveFirebaseConfig(null);
      localDB.setIsDemoMode(true);
      localStorage.removeItem("kharchaflow_demo_active_user");
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* Primary layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: General Profile, Theme & Budgets */}
        <div className="space-y-6">
          
          {/* User Profile name editor */}
          <div className="finance-card">
            <h4 className="text-xs font-bold text-white tracking-tight uppercase border-b border-zinc-800/60 pb-3.5 mb-5 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              User Profile Profile
            </h4>

            {profileError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs font-semibold">
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Profile name updated successfully!
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="finance-label">Registered Email</label>
                <input
                  type="text"
                  value={user?.email || ""}
                  disabled
                  className="finance-input opacity-50 cursor-not-allowed bg-zinc-950/60"
                />
              </div>
              <div>
                <label htmlFor="displayName-settings" className="finance-label">Display Name</label>
                <input
                  id="displayName-settings"
                  type="text"
                  placeholder="Karan Admin"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={profileSaving}
                  className="finance-input"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save profile
                </button>
              </div>
            </form>
          </div>

          {/* Theme & Display Options */}
          <div className="finance-card">
            <h4 className="text-xs font-bold text-white tracking-tight uppercase border-b border-zinc-800/60 pb-3.5 mb-5 flex items-center gap-2">
              <Sun className="w-4 h-4 text-emerald-400" />
              Theme & Interface
            </h4>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-300">Theme Preference</p>
                <p className="text-[10px] text-zinc-500">Toggle between Light and Default Dark aesthetics</p>
              </div>
              <button
                onClick={handleThemeToggle}
                className="w-12 h-6.5 rounded-full bg-zinc-950 border border-zinc-850 p-1 flex items-center justify-between relative transition-all"
              >
                <div className={`w-4.5 h-4.5 rounded-full bg-emerald-400 absolute transition-all duration-200 ${isDarkMode ? "right-1" : "left-1"}`}></div>
                <Sun className={`w-3.5 h-3.5 text-zinc-500 z-10 ml-0.5 ${!isDarkMode && "text-zinc-950 font-bold"}`} />
                <Moon className={`w-3.5 h-3.5 text-zinc-500 z-10 mr-0.5 ${isDarkMode && "text-zinc-950 font-bold"}`} />
              </button>
            </div>
          </div>

          {/* Monthly Budget caps editor */}
          <div className="finance-card">
            <h4 className="text-xs font-bold text-white tracking-tight uppercase border-b border-zinc-800/60 pb-3.5 mb-5 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Category budget Caps
            </h4>

            {budgetSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Category budget caps saved!
              </div>
            )}

            <form onSubmit={handleBudgetsSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto pr-1">
                {Object.keys(categoryBudgets).map((catName) => {
                  if (catName === "Income") return null;
                  return (
                    <div key={catName}>
                      <label htmlFor={`budget-${catName}`} className="finance-label">{catName} Limit</label>
                      <div className="relative">
                        <span className="absolute left-3 top-[10px] text-xs font-bold text-zinc-500">Rs.</span>
                        <input
                          id={`budget-${catName}`}
                          type="number"
                          value={categoryBudgets[catName] || ""}
                          onChange={(e) => handleBudgetChange(catName, e.target.value)}
                          className="finance-input pl-9 py-2 text-xs font-bold"
                          placeholder="150"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={budgetSaving}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Save Budget caps
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: Cloud Config / Firebase */}
        <div className="space-y-6">
          
          {/* Cloud Database Integration Form */}
          <div className="finance-card">
            <h4 className="text-xs font-bold text-white tracking-tight uppercase border-b border-zinc-800/60 pb-3.5 mb-5 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-400" />
              Cloud Database Integration (Firebase)
            </h4>

            {isDemoMode ? (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-emerald-300 text-xs mb-5 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-white">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  Running Offline Demo Mode
                </div>
                <p className="leading-relaxed text-zinc-400">
                  Data is currently saved entirely in your local browser sandbox. If you would like to backup your transactions, sync them across devices, and run real-time cloud operations, enter your custom Firebase project keys below.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 text-xs mb-5 flex justify-between items-center">
                <div className="flex items-center gap-2.5 font-bold">
                  <Cloud className="w-4.5 h-4.5 animate-pulse" />
                  Live Sync Activated
                </div>
                <button
                  onClick={handleResetToDemo}
                  className="px-3 py-1 border border-rose-500/20 hover:bg-rose-500/5 text-rose-400 rounded-lg font-bold text-[10px] transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}

            {configSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                Saving credentials and hot-reloading app...
              </div>
            )}

            <form onSubmit={handleFirebaseConfigSave} className="space-y-3.5">
              <div>
                <label htmlFor="apiKey" className="finance-label">Firebase API Key *</label>
                <input
                  id="apiKey"
                  type="text"
                  placeholder="AIzaSyA..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  className="finance-input py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="projectId" className="finance-label">Project ID *</label>
                  <input
                    id="projectId"
                    type="text"
                    placeholder="kharchaflow-prod"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                    className="finance-input py-2 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="authDomain" className="finance-label">Auth Domain</label>
                  <input
                    id="authDomain"
                    type="text"
                    placeholder="kharchaflow.firebaseapp.com"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    className="finance-input py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="storageBucket" className="finance-label">Storage Bucket</label>
                <input
                  id="storageBucket"
                  type="text"
                  placeholder="kharchaflow.appspot.com"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  className="finance-input py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="messagingSenderId" className="finance-label">Sender ID</label>
                  <input
                    id="messagingSenderId"
                    type="text"
                    placeholder="482930219"
                    value={messagingSenderId}
                    onChange={(e) => setMessagingSenderId(e.target.value)}
                    className="finance-input py-2 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="appId" className="finance-label">App ID</label>
                  <input
                    id="appId"
                    type="text"
                    placeholder="1:4829:web:12a83"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    className="finance-input py-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  Save & Enable Cloud Sync
                </button>
              </div>
            </form>
          </div>

          {/* Quick Sign Out Action */}
          <div className="finance-card">
            <h4 className="text-xs font-bold text-white tracking-tight uppercase border-b border-zinc-800/60 pb-3.5 mb-4">
              Termination
            </h4>
            <p className="text-xs text-zinc-400 mb-4 leading-normal">
              Terminates your current session and clears local credentials. Transactions inside LocalStorage are preserved.
            </p>
            <button
              onClick={logout}
              className="w-full bg-zinc-950 hover:bg-rose-500/5 text-rose-400 hover:text-rose-450 border border-zinc-800 hover:border-rose-500/10 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out of KharchaFlow
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
