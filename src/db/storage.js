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
  photoURL: null
};

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
    localStorage.removeItem("kharchaflow_initial_balances");
    localStorage.removeItem("kharchaflow_profile");
  }
};
