import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { useCalendar } from "../context/CalendarContext";
import { db, reloadFirebaseApp } from "../../../backend/db/firebase";
import { localDB } from "../../../backend/db/storage";
import { CATEGORIES } from "../utils/constants";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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
  HelpCircle,
  Shield,
  Trash2,
  CalendarDays,
  MessageSquare,
  Star,
  Send,
  Landmark,
  Plus,
  Pencil,
  DollarSign,
  Tag
} from "lucide-react";

export default function Settings() {
  const { user, isDemoMode, logout, updateUserProfile, updateUserPassword, deleteUserAccount } = useAuth();
  const { budgets, updateBudgets, bankAccounts, addBankAccount, updateBankAccount, deleteBankAccount, categories, addCategory, updateCategory, deleteCategory, toggleDefaultCategory } = useFinance();
  const { dateSystem, setDateSystem } = useCalendar();
  const [dateSystemSaving, setDateSystemSaving] = useState(false);
  const [currencySaving, setCurrencySaving] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState(() => localStorage.getItem("kharchaflow_currency") || "INR");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Budgets state fields
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [budgetSuccess, setBudgetSuccess] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);

  const [bankAccountName, setBankAccountName] = useState("");
  const [editingBankAccountId, setEditingBankAccountId] = useState(null);
  const [bankAccountError, setBankAccountError] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryError, setCategoryError] = useState("");
  const [categorySuccess, setCategorySuccess] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);
  const [bankAccountSuccess, setBankAccountSuccess] = useState("");
  const [bankAccountSaving, setBankAccountSaving] = useState(false);

  // Theme state fields
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("kharchaflow_theme") === "dark";
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
      setPhone(user.phone || "");
      setLanguage(user.language || "en");
      setPhotoURL(user.photoURL || "");
      setPhotoPreview(user.photoURL || "");
      setPreferredCurrency(user.currency || localStorage.getItem("kharchaflow_currency") || "INR");
    }
  }, [user]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setProfileError("Please choose an image file.");
        e.target.value = "";
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setProfileError("Image size exceeds the 2MB limit.");
        e.target.value = "";
        return;
      }
      setProfileError("");
      const objectUrl = URL.createObjectURL(file);
      setPhotoPreview(objectUrl);
      setPhotoFile(file);
    }
  };

  const createCompressedPhoto = (file) => new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const maxSize = 256;
      let { width, height } = img;
      if (width > height && width > maxSize) {
        height *= maxSize / width;
        width = maxSize;
      } else if (height > maxSize) {
        width *= maxSize / height;
        height = maxSize;
      }
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected image could not be read."));
    };
    img.src = objectUrl;
  });

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

  const handleDateSystemChange = async (nextDateSystem) => {
    setDateSystemSaving(true);
    try {
      await setDateSystem(nextDateSystem);
    } catch (err) {
      console.error("Date system update error:", err);
      alert("Unable to save the date system preference.");
    } finally {
      setDateSystemSaving(false);
    }
  };

  const handleCurrencyChange = async (nextCurrency) => {
    setCurrencySaving(true);
    try {
      await updateUserProfile({ currency: nextCurrency });
      setPreferredCurrency(nextCurrency);
      localStorage.setItem("kharchaflow_currency", nextCurrency);
    } catch (err) {
      console.error("Currency update error:", err);
      alert("Unable to save the currency preference.");
    } finally {
      setCurrencySaving(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackError("");
    setFeedbackSuccess(false);

    if (!feedbackRating) {
      setFeedbackError("Please choose a rating.");
      return;
    }
    if (!feedbackMessage.trim()) {
      setFeedbackError("Please write your feedback.");
      return;
    }

    setFeedbackSaving(true);
    const feedback = {
      rating: feedbackRating,
      message: feedbackMessage.trim(),
      userId: user?.uid || null,
      userEmail: user?.email || null,
      userName: user?.displayName || null,
      submittedAt: new Date().toISOString()
    };

    try {
      if (isDemoMode || !db) {
        localDB.saveFeedback(feedback);
      } else {
        await addDoc(collection(db, "feedback"), {
          ...feedback,
          submittedAt: serverTimestamp()
        });
      }
      setFeedbackRating(0);
      setFeedbackMessage("");
      setFeedbackSuccess(true);
    } catch (err) {
      console.error("Feedback submission error:", err);
      setFeedbackError("Unable to send feedback. Please try again.");
    } finally {
      setFeedbackSaving(false);
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
      let finalPhotoURL = photoURL;

      if (photoFile) {
        const compressedPhoto = await createCompressedPhoto(photoFile);
        // Store the optimized image in the profile document. This works in demo
        // mode and live mode without depending on Firebase Storage CORS/rules.
        finalPhotoURL = compressedPhoto;
      }

      await updateUserProfile({
        displayName: displayName.trim(),
        phone: phone.trim(),
        language,
        photoURL: finalPhotoURL
      });
      setPhotoFile(null);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const [password, setPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);
    
    if (!password.trim() || password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    setPasswordSaving(true);
    try {
      await updateUserPassword(password);
      setPasswordSuccess(true);
      setPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setPasswordError("Failed to update password. You may need to log out and log back in.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently erase your data.")) {
      try {
        await deleteUserAccount();
      } catch (err) {
        alert("Failed to delete account. You may need to log out and log back in first.");
      }
    }
  };

  // Budgets Save
  const handleBudgetChange = (cat, val) => {
    setCategoryBudgets((prev) => ({ ...prev, [cat]: val }));
  };

  const resetBankAccountForm = () => {
    setBankAccountName("");
    setEditingBankAccountId(null);
    setBankAccountError("");
  };

  const handleBankAccountSubmit = async (e) => {
    e.preventDefault();
    setBankAccountError("");
    setBankAccountSuccess("");

    const trimmedName = bankAccountName.trim();
    if (!trimmedName) {
      setBankAccountError("Please enter an account name.");
      return;
    }

    setBankAccountSaving(true);
    try {
      if (editingBankAccountId) {
        await updateBankAccount(editingBankAccountId, trimmedName);
        setBankAccountSuccess("Bank account updated.");
      } else {
        await addBankAccount(trimmedName);
        setBankAccountSuccess("Bank account added.");
      }
      resetBankAccountForm();
    } catch (err) {
      console.error("Bank account save error:", err);
      setBankAccountError(err.message || "Unable to save bank account.");
    } finally {
      setBankAccountSaving(false);
    }
  };

  const handleEditBankAccount = (account) => {
    setEditingBankAccountId(account.id);
    setBankAccountName(account.name);
    setBankAccountError("");
    setBankAccountSuccess("");
  };

  const handleDeleteBankAccount = async (id) => {
    if (!confirm("Delete this bank account from your list?")) return;
    try {
      await deleteBankAccount(id);
      if (editingBankAccountId === id) resetBankAccountForm();
      setBankAccountSuccess("Bank account removed.");
    } catch (err) {
      console.error("Delete bank account error:", err);
      setBankAccountError("Unable to delete bank account.");
    }
  };

  const resetCategoryForm = () => {
    setCategoryName("");
    setEditingCategoryId(null);
    setCategoryError("");
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setCategoryError("");
    setCategorySuccess("");

    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      setCategoryError("Please enter a category name.");
      return;
    }

    setCategorySaving(true);
    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, trimmedName);
        setCategorySuccess("Category updated.");
      } else {
        await addCategory(trimmedName);
        setCategorySuccess("Category added.");
      }
      resetCategoryForm();
    } catch (err) {
      console.error("Category save error:", err);
      setCategoryError(err.message || "Unable to save category.");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryError("");
    setCategorySuccess("");
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Delete this custom category from your list?")) return;
    try {
      await deleteCategory(id);
      if (editingCategoryId === id) resetCategoryForm();
      setCategorySuccess("Category removed.");
    } catch (err) {
      console.error("Delete category error:", err);
      setCategoryError("Unable to delete category.");
    }
  };

  const handleDefaultCategoryToggle = async (categoryName) => {
    setCategoryError("");
    setCategorySuccess("");
    try {
      await toggleDefaultCategory(categoryName);
    } catch (err) {
      console.error("Default category selection error:", err);
      setCategoryError("Unable to update the selected categories.");
    }
  };

  const handleBudgetsSave = async (e) => {
    e.preventDefault();
    setBudgetSuccess(false);
    setBudgetSaving(true);
    
    try {
      await updateBudgets(categoryBudgets);
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
                  placeholder="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={profileSaving}
                  className="finance-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="phone-settings" className="finance-label">Phone Number</label>
                  <input
                    id="phone-settings"
                    type="tel"
                    placeholder="+1 234 567 890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={profileSaving}
                    className="finance-input"
                  />
                </div>
                <div>
                  <label htmlFor="language-settings" className="finance-label">Language</label>
                  <select
                    id="language-settings"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={profileSaving}
                    className="finance-input h-10 py-0"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="finance-label">Profile Picture</label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center relative group">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-zinc-500" />
                    )}
                    <label htmlFor="photo-upload" className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all">
                      <span className="text-[10px] font-bold text-white">CHANGE</span>
                    </label>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="photo-upload" className="cursor-pointer px-3 py-1.5 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-lg text-xs font-semibold text-zinc-300 transition-colors inline-block mb-1">
                      Choose Image
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={profileSaving}
                      className="hidden"
                    />
                    <p className="text-[10px] text-zinc-500">Max size 2MB. JPG, PNG, GIF allowed.</p>
                  </div>
                </div>
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

          <div className="finance-card">
            <h4 className="text-xs font-bold text-white tracking-tight uppercase border-b border-zinc-800/60 pb-3.5 mb-5 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              Date System
            </h4>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-zinc-300">Calendar Preference</p>
                <p className="text-[10px] text-zinc-500">Use Gregorian dates or Nepali Bikram Sambat dates across your records.</p>
              </div>
              <select
                aria-label="Date system"
                value={dateSystem}
                onChange={(e) => handleDateSystemChange(e.target.value)}
                disabled={dateSystemSaving}
                className="finance-input h-10 py-0 w-40 shrink-0 text-xs font-semibold"
              >
                <option value="gregorian">English (AD)</option>
                <option value="nepali">Nepali (BS)</option>
              </select>
            </div>
          </div>

          {/* Theme & Display Options */}
          <div className="finance-card">
            <h4 className="text-xs font-bold text-white tracking-tight uppercase border-b border-zinc-800/60 pb-3.5 mb-5 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Currency Preference
            </h4>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-zinc-300">Preferred Currency</p>
                <p className="text-[10px] text-zinc-500">All financial summaries and transaction amounts will use this currency.</p>
              </div>
              <select
                aria-label="Currency"
                value={preferredCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                disabled={currencySaving}
                className="finance-input h-10 py-0 w-40 shrink-0 text-xs font-semibold"
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="NPR">Nepalese Rupee (Rs.)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
                <option value="AUD">Australian Dollar (A$)</option>
                <option value="JPY">Japanese Yen (¥)</option>
              </select>
            </div>
          </div>

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

          {/* Bank account manager */}
          <div className="finance-card">
            <h4 className="text-xs font-bold text-white tracking-tight uppercase border-b border-zinc-800/60 pb-3.5 mb-5 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-400" />
              Bank Accounts
            </h4>

            {bankAccountError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs font-semibold">
                {bankAccountError}
              </div>
            )}

            {bankAccountSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs font-semibold">
                {bankAccountSuccess}
              </div>
            )}

            <form onSubmit={handleBankAccountSubmit} className="space-y-3 mb-4">
              <div>
                <label htmlFor="bank-account-name" className="finance-label">
                  {editingBankAccountId ? "Edit account name" : "Add account name"}
                </label>
                <input
                  id="bank-account-name"
                  type="text"
                  placeholder="NIC Asia, Global IME, eSewa"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  disabled={bankAccountSaving}
                  className="finance-input"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={bankAccountSaving}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
                >
                  {editingBankAccountId ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {editingBankAccountId ? "Save changes" : "Add account"}
                </button>
                {editingBankAccountId && (
                  <button
                    type="button"
                    onClick={resetBankAccountForm}
                    className="px-3 py-2 border border-zinc-800 rounded-xl text-xs text-zinc-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {bankAccounts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 p-3 text-xs text-zinc-500">
                  No bank accounts yet. Add one above and it will appear in transaction forms.
                </div>
              ) : (
                bankAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
                    <span className="text-sm font-semibold text-zinc-200">{account.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditBankAccount(account)}
                        className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                        aria-label={`Edit ${account.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBankAccount(account.id)}
                        className="p-2 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10"
                        aria-label={`Delete ${account.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Custom category manager */}
          <div className="finance-card">
            <h4 className="text-xs font-bold text-white tracking-tight uppercase border-b border-zinc-800/60 pb-3.5 mb-5 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              Custom Categories
            </h4>

            <p className="text-[10px] text-zinc-500 mb-4">Select exactly the default categories you want to see when recording an expense, then add any categories of your own.</p>

            <div className="mb-5">
              <p className="finance-label mb-2">Default expense categories</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(CATEGORIES).filter((name) => name !== "Income").map((name) => {
                  const isSelected = categories.some((category) => category.name === name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleDefaultCategoryToggle(name)}
                      className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-colors ${isSelected ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}
                      aria-pressed={isSelected}
                    >
                      {isSelected ? "✓ " : "+ "}{name}
                    </button>
                  );
                })}
                {categories.filter((category) => !category.isDefault).map((category) => (
                  <div key={category.id} className="inline-flex items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <span className="px-3 py-2 text-[10px] font-bold">{category.name}</span>
                    <button
                      type="button"
                      onClick={() => handleEditCategory(category)}
                      className="p-2 border-l border-emerald-500/20 hover:bg-emerald-500/10"
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 border-l border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-400"
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {categoryError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs font-semibold">
                {categoryError}
              </div>
            )}

            {categorySuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs font-semibold">
                {categorySuccess}
              </div>
            )}

            <form onSubmit={handleCategorySubmit} className="space-y-3 mb-4">
              <div>
                <label htmlFor="custom-category-name" className="finance-label">
                  {editingCategoryId ? "Edit category name" : "Add category name"}
                </label>
                <input
                  id="custom-category-name"
                  type="text"
                  placeholder="e.g. Freelance, Pets, Subscriptions"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  disabled={categorySaving}
                  className="finance-input"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={categorySaving}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors disabled:opacity-60"
                >
                  {editingCategoryId ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {editingCategoryId ? "Save changes" : "Add category"}
                </button>
                {editingCategoryId && (
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="px-3 py-2 border border-zinc-800 rounded-xl text-xs text-zinc-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

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
          {user?.isAdmin && (
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
          )}

          <div className="finance-card">
            <h4 className="text-xs font-bold text-white tracking-tight uppercase border-b border-zinc-800/60 pb-3.5 mb-5 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Feedback
            </h4>

            {feedbackError && <p className="mb-4 text-xs font-semibold text-rose-400">{feedbackError}</p>}
            {feedbackSuccess && <p className="mb-4 text-xs font-semibold text-emerald-400">Thank you for sharing your feedback.</p>}

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="finance-label">Your Rating</label>
                <div className="flex gap-1" role="radiogroup" aria-label="App rating">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFeedbackRating(rating)}
                      className="p-1.5 text-zinc-600 hover:text-amber-400 transition-colors"
                      role="radio"
                      aria-checked={feedbackRating === rating}
                      aria-label={`${rating} out of 5 stars`}
                    >
                      <Star className={`w-5 h-5 ${rating <= feedbackRating ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="feedback-message" className="finance-label">Your Feedback</label>
                <textarea
                  id="feedback-message"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  disabled={feedbackSaving}
                  maxLength={1000}
                  rows={4}
                  className="finance-input resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={feedbackSaving}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-zinc-950 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {feedbackSaving ? "Sending..." : "Send Feedback"}
              </button>
            </form>
          </div>

          {/* Security & Password */}
          <div className="finance-card">
            <h4 className="text-xs font-bold text-white tracking-tight uppercase border-b border-zinc-800/60 pb-3.5 mb-5 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Security Settings
            </h4>

            {passwordError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs font-semibold">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Password updated successfully!
              </div>
            )}

            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="finance-label">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={passwordSaving}
                  className="finance-input"
                />
              </div>
              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Update Password
              </button>
            </form>
          </div>

          {/* Quick Sign Out Action */}
          <div className="finance-card">
            <h4 className="text-xs font-bold text-white tracking-tight uppercase border-b border-zinc-800/60 pb-3.5 mb-4">
              Danger Zone
            </h4>
            <p className="text-xs text-zinc-400 mb-4 leading-normal">
              Terminates your current session and clears local credentials. Transactions inside LocalStorage are preserved.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={logout}
                className="w-full bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out of KharchaFlow
              </button>
              
              <button
                onClick={handleDeleteAccount}
                className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/30 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Account
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
