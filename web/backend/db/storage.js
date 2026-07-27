// Fresh template data with no seeded transactions and zeroed balances
const DEFAULT_TRANSACTIONS = [];

const DEFAULT_BUDGETS = {
  Food: 0,
  Transport: 0,
  Shopping: 0,
  Bills: 0,
  Entertainment: 0,
  Education: 0,
  Health: 0,
  Others: 0
};

const DEFAULT_PROFILE = {
  displayName: "Fintech User",
  email: "user@kharchaflow.com",
  photoURL: null,
  dateSystem: "gregorian",
  currency: "INR"
};

const DEFAULT_FINANCIAL_GOALS = [];
const DEFAULT_BANK_ACCOUNTS = [];
// These are the expense categories selected for a new user. Users can turn
// individual defaults on or off from Settings, or add their own categories.
const DEFAULT_CUSTOM_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Education",
  "Health",
  "Others"
].map((name) => ({ id: `default-${name.toLowerCase()}`, name, isDefault: true }));

// Initial state of balances mapped to payment methods (all default to zero)
const DEFAULT_INITIAL_BALANCES = {
  "Cash": 0.00,
  "Credit Card": 0.00,
  "Bank Account": {
    "Global IME Bank": 0.00,
    "Nabil Bank": 0.00,
    "NIC Asia Bank": 0.00,
    "Prabhu Bank": 0.00,
    "Everest Bank": 0.00,
  },
  "eWallet": {
    "eSewa": 0.00,
    "Khalti": 0.00,
    "IME Pay": 0.00
  },
  "Mobile Banking": {
    "Global IME Bank": 0.00,
    "Nabil Bank": 0.00,
    "NIC Asia Bank": 0.00,
    "Prabhu Bank": 0.00,
    "Everest Bank": 0.00
  }
};


export const localDB = {
  getDefaultBudgets: () => DEFAULT_BUDGETS,
  getDefaultInitialBalances: () => DEFAULT_INITIAL_BALANCES,
  getTransactions: () => {
    const txs = localStorage.getItem("kharchaflow_transactions");
    if (!txs) {
      localStorage.setItem("kharchaflow_transactions", JSON.stringify(DEFAULT_TRANSACTIONS));
      return DEFAULT_TRANSACTIONS;
    }
    return JSON.parse(txs);
  },

  saveTransactions: (transactions) => {
    localStorage.setItem("kharchaflow_transactions", JSON.stringify(transactions));
  },

  getBudgets: () => {
    const budgets = localStorage.getItem("kharchaflow_budgets");
    if (!budgets) {
      localStorage.setItem("kharchaflow_budgets", JSON.stringify(DEFAULT_BUDGETS));
      return DEFAULT_BUDGETS;
    }
    return JSON.parse(budgets);
  },

  saveBudgets: (budgets) => {
    localStorage.setItem("kharchaflow_budgets", JSON.stringify(budgets));
  },

  getFinancialGoals: () => {
    const goals = localStorage.getItem("kharchaflow_financial_goals");
    if (!goals) {
      localStorage.setItem("kharchaflow_financial_goals", JSON.stringify(DEFAULT_FINANCIAL_GOALS));
      return DEFAULT_FINANCIAL_GOALS;
    }
    return JSON.parse(goals);
  },

  saveFinancialGoals: (goals) => {
    localStorage.setItem("kharchaflow_financial_goals", JSON.stringify(goals));
  },

  getBankAccounts: () => {
    const accounts = localStorage.getItem("kharchaflow_bank_accounts");
    if (!accounts) {
      localStorage.setItem("kharchaflow_bank_accounts", JSON.stringify(DEFAULT_BANK_ACCOUNTS));
      return DEFAULT_BANK_ACCOUNTS;
    }
    return JSON.parse(accounts);
  },

  saveBankAccounts: (accounts) => {
    localStorage.setItem("kharchaflow_bank_accounts", JSON.stringify(accounts));
  },

  getInitialBalances: () => {
    const balances = localStorage.getItem("kharchaflow_initial_balances");
    if (!balances) {
      localStorage.setItem("kharchaflow_initial_balances", JSON.stringify(DEFAULT_INITIAL_BALANCES));
      return DEFAULT_INITIAL_BALANCES;
    }
    return JSON.parse(balances);
  },

  saveInitialBalances: (balances) => {
    localStorage.setItem("kharchaflow_initial_balances", JSON.stringify(balances));
  },

  getCustomCategories: () => {
    const categories = localStorage.getItem("kharchaflow_custom_categories");
    if (!categories) {
      localStorage.setItem("kharchaflow_custom_categories", JSON.stringify(DEFAULT_CUSTOM_CATEGORIES));
      return DEFAULT_CUSTOM_CATEGORIES;
    }
    return JSON.parse(categories);
  },

  saveCustomCategories: (categories) => {
    localStorage.setItem("kharchaflow_custom_categories", JSON.stringify(categories));
  },

  getProfile: () => {
    const profile = localStorage.getItem("kharchaflow_profile");
    if (!profile) {
      localStorage.setItem("kharchaflow_profile", JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    return JSON.parse(profile);
  },

  saveProfile: (profile) => {
    localStorage.setItem("kharchaflow_profile", JSON.stringify(profile));
  },

  saveFeedback: (feedback) => {
    const savedFeedback = JSON.parse(localStorage.getItem("kharchaflow_feedback") || "[]");
    localStorage.setItem("kharchaflow_feedback", JSON.stringify([...savedFeedback, feedback]));
  },

  getFirebaseConfig: () => {
    const config = localStorage.getItem("kharchaflow_firebase_config");
    return config ? JSON.parse(config) : null;
  },

  saveFirebaseConfig: (config) => {
    if (config) {
      localStorage.setItem("kharchaflow_firebase_config", JSON.stringify(config));
    } else {
      localStorage.removeItem("kharchaflow_firebase_config");
    }
  },

  getIsDemoMode: () => {
    const isDemo = localStorage.getItem("kharchaflow_demo_mode");
    return isDemo !== "false"; // Defaults to true if not set
  },

  setIsDemoMode: (isDemo) => {
    localStorage.setItem("kharchaflow_demo_mode", isDemo ? "true" : "false");
  },

  resetAllData: () => {
    localStorage.removeItem("kharchaflow_transactions");
    localStorage.removeItem("kharchaflow_budgets");
    localStorage.removeItem("kharchaflow_financial_goals");
    localStorage.removeItem("kharchaflow_initial_balances");
    localStorage.removeItem("kharchaflow_bank_accounts");
    localStorage.removeItem("kharchaflow_custom_categories");
    localStorage.removeItem("kharchaflow_profile");
  },

  seedDummyData: () => {
    const dummyBudgets = {
      Food: 15000,
      Transport: 5000,
      Shopping: 12000,
      Bills: 8000,
      Entertainment: 6000,
      Education: 4000,
      Health: 5000,
      Others: 5000
    };

    const dummyInitialBalances = {
      "Cash": 8500.00,
      "Credit Card": -4200.00,
      "Bank Account": {
        "Global IME Bank": 12000.00,
        "Nabil Bank": 45000.00,
        "NIC Asia Bank": 8500.00,
        "Prabhu Bank": 0.00,
        "Everest Bank": 0.00,
      },
      "eWallet": {
        "eSewa": 4500.00,
        "Khalti": 1800.00,
        "IME Pay": 0.00
      },
      "Mobile Banking": {
        "Global IME Bank": 6000.00,
        "Nabil Bank": 15000.00,
        "NIC Asia Bank": 2500.00,
        "Prabhu Bank": 0.00,
        "Everest Bank": 0.00
      }
    };

    const now = new Date();
    const getDateStr = (offsetDays) => {
      const d = new Date(now);
      d.setDate(now.getDate() - offsetDays);
      return d.toISOString().split("T")[0];
    };

    const dummyTransactions = [
      {
        id: "tx-dummy-1",
        title: "Monthly Salary",
        amount: 85000,
        type: "income",
        category: "Income",
        paymentMethod: "Bank Account",
        provider: "Nabil Bank",
        date: getDateStr(5),
        notes: "Company salary payout",
        createdAt: new Date(getDateStr(5)).toISOString()
      },
      {
        id: "tx-dummy-2",
        title: "Internet & Water Bill",
        amount: 3200,
        type: "expense",
        category: "Bills",
        paymentMethod: "eWallet",
        provider: "eSewa",
        date: getDateStr(3),
        notes: "Monthly utilities",
        createdAt: new Date(getDateStr(3)).toISOString()
      },
      {
        id: "tx-dummy-3",
        title: "Groceries at Bhatbhateni",
        amount: 5400,
        type: "expense",
        category: "Food",
        paymentMethod: "Mobile Banking",
        provider: "Nabil Bank",
        date: getDateStr(2),
        notes: "Weekly kitchen stock",
        createdAt: new Date(getDateStr(2)).toISOString()
      },
      {
        id: "tx-dummy-4",
        title: "Pathao / Ride Sharing",
        amount: 350,
        type: "expense",
        category: "Transport",
        paymentMethod: "Cash",
        provider: "",
        date: getDateStr(0),
        notes: "Ride to office",
        createdAt: new Date().toISOString()
      },
      {
        id: "tx-dummy-5",
        title: "Freelance UI Design",
        amount: 25000,
        type: "income",
        category: "Income",
        paymentMethod: "Bank Account",
        provider: "Global IME Bank",
        date: getDateStr(4),
        notes: "Landing page design project",
        createdAt: new Date(getDateStr(4)).toISOString()
      },
      {
        id: "tx-dummy-6",
        title: "Winter Jacket",
        amount: 4500,
        type: "expense",
        category: "Shopping",
        paymentMethod: "Credit Card",
        provider: "",
        date: getDateStr(1),
        notes: "Shopping for winter clothes",
        createdAt: new Date(getDateStr(1)).toISOString()
      },
      {
        id: "tx-dummy-7",
        title: "QFX Cinema Tickets",
        amount: 900,
        type: "expense",
        category: "Entertainment",
        paymentMethod: "eWallet",
        provider: "Khalti",
        date: getDateStr(2),
        notes: "Movie with friends",
        createdAt: new Date(getDateStr(2)).toISOString()
      },
      {
        id: "tx-dummy-8",
        title: "Medicine",
        amount: 1200,
        type: "expense",
        category: "Health",
        paymentMethod: "Cash",
        provider: "",
        date: getDateStr(4),
        notes: "Vitamins and cold medicine",
        createdAt: new Date(getDateStr(4)).toISOString()
      }
    ];

    localStorage.setItem("kharchaflow_budgets", JSON.stringify(dummyBudgets));
    localStorage.setItem("kharchaflow_initial_balances", JSON.stringify(dummyInitialBalances));
    localStorage.setItem("kharchaflow_transactions", JSON.stringify(dummyTransactions));
  }
};
