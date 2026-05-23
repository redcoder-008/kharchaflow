// Seed data to make the dashboard look highly professional and populated from day one
const DEFAULT_TRANSACTIONS = [
  {
    id: "tx-seed-1",
    amount: 3200.00,
    type: "income",
    category: "Income",
    date: "2026-05-01",
    paymentMethod: "Bank Account",
    provider: "Everest Bank",
    notes: "Monthly Software Engineer Salary",
    createdAt: new Date("2026-05-01T10:00:00Z").toISOString()
  },
  {
    id: "tx-seed-2",
    amount: 12.50,
    type: "expense",
    category: "Food",
    date: "2026-05-20",
    paymentMethod: "eWallet",
    provider: "eSewa",
    notes: "Lunch at Burger House",
    createdAt: new Date("2026-05-20T13:15:00Z").toISOString()
  },
  {
    id: "tx-seed-3",
    amount: 75.00,
    type: "expense",
    category: "Bills",
    date: "2026-05-15",
    paymentMethod: "Bank Account",
    provider: "Nabil Bank",
    notes: "Electricity and Water Bills",
    createdAt: new Date("2026-05-15T09:30:00Z").toISOString()
  },
  {
    id: "tx-seed-4",
    amount: 8.00,
    type: "expense",
    category: "Transport",
    date: "2026-05-21",
    paymentMethod: "Cash",
    provider: "",
    notes: "Taxi to office",
    createdAt: new Date("2026-05-21T08:45:00Z").toISOString()
  },
  {
    id: "tx-seed-5",
    amount: 68.40,
    type: "expense",
    category: "Shopping",
    date: "2026-05-18",
    paymentMethod: "Mobile Banking",
    provider: "Global IME Bank",
    notes: "Weekly grocery at Bhatbhateni",
    createdAt: new Date("2026-05-18T16:20:00Z").toISOString()
  },
  {
    id: "tx-seed-6",
    amount: 15.00,
    type: "expense",
    category: "Entertainment",
    date: "2026-05-14",
    paymentMethod: "Credit Card",
    provider: "",
    notes: "Netflix Premium Subscription",
    createdAt: new Date("2026-05-14T21:00:00Z").toISOString()
  },
  {
    id: "tx-seed-7",
    amount: 450.00,
    type: "income",
    category: "Income",
    date: "2026-05-10",
    paymentMethod: "eWallet",
    provider: "Khalti",
    notes: "Payment for freelance UI work",
    createdAt: new Date("2026-05-10T11:30:00Z").toISOString()
  },
  {
    id: "tx-seed-8",
    amount: 45.00,
    type: "expense",
    category: "Health",
    date: "2026-05-05",
    paymentMethod: "Bank Account",
    provider: "NIC Asia Bank",
    notes: "Routine medical checkup & medicines",
    createdAt: new Date("2026-05-05T10:15:00Z").toISOString()
  },
  {
    id: "tx-seed-9",
    amount: 25.00,
    type: "expense",
    category: "Education",
    date: "2026-05-12",
    paymentMethod: "eWallet",
    provider: "IME Pay",
    notes: "Bought Next.js Advanced Course on Udemy",
    createdAt: new Date("2026-05-12T14:40:00Z").toISOString()
  }
];

const DEFAULT_BUDGETS = {
  Food: 300,
  Transport: 100,
  Shopping: 400,
  Bills: 200,
  Entertainment: 150,
  Education: 100,
  Health: 150,
  Others: 150
};

const DEFAULT_PROFILE = {
  displayName: "Karan Admin",
  email: "karan@kharchaflow.com",
  photoURL: null
};

// Initial state of balances mapped to payment methods
const DEFAULT_INITIAL_BALANCES = {
  "Cash": 250.00,
  "Credit Card": -120.00, // Credit limit utilization or negative outstanding
  "Bank Account": {
    "Global IME Bank": 1500.00,
    "Nabil Bank": 850.00,
    "NIC Asia Bank": 430.00,
    "Prabhu Bank": 200.00,
    "Everest Bank": 3200.00,
  },
  "eWallet": {
    "eSewa": 340.50,
    "Khalti": 490.00,
    "IME Pay": 95.00
  },
  "Mobile Banking": {
    "Global IME Bank": 500.00,
    "Nabil Bank": 250.00,
    "NIC Asia Bank": 150.00,
    "Prabhu Bank": 100.00,
    "Everest Bank": 300.00
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
