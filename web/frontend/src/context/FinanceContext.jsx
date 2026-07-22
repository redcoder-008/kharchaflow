import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { localDB } from "../../../backend/db/storage";
import { db } from "../../../backend/db/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  setDoc,
  deleteDoc,
  updateDoc 
} from "firebase/firestore";

const FinanceContext = createContext();

export function useFinance() {
  return useContext(FinanceContext);
}

export function FinanceProvider({ children }) {
  const { user, isDemoMode } = useAuth();
  
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [financialGoals, setFinancialGoals] = useState([]);
  const [initialBalances, setInitialBalances] = useState({});
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync status state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingTx, setPendingTx] = useState(false);
  const [pendingUser, setPendingUser] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const syncStatus = isDemoMode 
    ? "synced" 
    : isOnline 
      ? ((pendingTx || pendingUser) ? "pending" : "synced")
      : "offline";

  // Load configuration & data
  useEffect(() => {
    if (isDemoMode) {
      // LocalStorage Demo Mode Data Sync
      setTransactions(localDB.getTransactions());
      setBudgets(localDB.getBudgets());
      setFinancialGoals(localDB.getFinancialGoals());
      setInitialBalances(localDB.getInitialBalances());
      setBankAccounts(localDB.getBankAccounts());
      setLoading(false);
      return;
    }

    if (!user) {
      setTransactions([]);
      setBudgets({});
      setFinancialGoals([]);
      setInitialBalances({});
      setLoading(false);
      return;
    }

    // Clear state before live sync to prevent data leakage from previous users
    setTransactions([]);
    setBudgets({});
    setFinancialGoals([]);
    setInitialBalances({});
    setBankAccounts([]);

    // Live Firebase Firestore Sync
    if (!db) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Transactions Listener
    const txQuery = query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("date", "desc")
    );

    const unsubscribeTx = onSnapshot(txQuery, { includeMetadataChanges: true }, (snapshot) => {
      const txList = [];
      snapshot.forEach((doc) => {
        txList.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(txList);
      setPendingTx(snapshot.metadata.hasPendingWrites);
    }, (err) => {
      console.error("Firestore transactions error: ", err);
    });

    // 2. Unified User Document Listener (Budgets & Initial Balances)
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribeUserDoc = onSnapshot(userDocRef, { includeMetadataChanges: true }, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.budgets) setBudgets(data.budgets);
        if (data.financialGoals) setFinancialGoals(data.financialGoals);
        if (data.initialBalances) setInitialBalances(data.initialBalances);
        setBankAccounts(Array.isArray(data.bankAccounts) ? data.bankAccounts : localDB.getBankAccounts());
      } else {
        // Fallback: Seed unified document
        const defaultBudgets = localDB.getDefaultBudgets();
        const defaultBalances = localDB.getDefaultInitialBalances();
        const initialBankAccounts = localDB.getBankAccounts();
        setDoc(userDocRef, {
          budgets: defaultBudgets,
          initialBalances: defaultBalances,
          financialGoals: [],
          bankAccounts: initialBankAccounts
        }, { merge: true });
        setBudgets(defaultBudgets);
        setInitialBalances(defaultBalances);
        setBankAccounts(initialBankAccounts);
      }
      setPendingUser(docSnap.metadata.hasPendingWrites);
      setLoading(false);
    }, (err) => {
      console.error("Firestore user doc error: ", err);
      setLoading(false);
    });

    return () => {
      unsubscribeTx();
      unsubscribeUserDoc();
    };
  }, [user, isDemoMode]);

  // Operations
  const addTransaction = async (txData) => {
    const newTx = {
      ...txData,
      amount: Number(txData.amount),
      createdAt: new Date().toISOString()
    };

    if (isDemoMode || !user) {
      const txList = [
        { id: "tx-" + Math.random().toString(36).substring(2, 9), ...newTx },
        ...transactions
      ];
      setTransactions(txList);
      localDB.saveTransactions(txList);
      return true;
    } else {
      const txToSave = { ...newTx, uid: user.uid };
      const tempId = "temp-" + Date.now();
      
      // Optimistic update
      setTransactions(prev => [{ id: tempId, ...txToSave }, ...prev]);
      
      // Fire and forget to support offline queuing without blocking UI
      addDoc(collection(db, "users", user.uid, "transactions"), txToSave)
        .catch(error => {
          setTransactions(prev => prev.filter(tx => tx.id !== tempId));
          console.error("Add transaction error:", error);
        });
      
      return tempId;
    }
  };

  const editTransaction = async (id, updatedTxData) => {
    const updated = {
      ...updatedTxData,
      amount: Number(updatedTxData.amount)
    };

    if (isDemoMode || !user) {
      const txList = transactions.map((tx) => tx.id === id ? { ...tx, ...updated } : tx);
      setTransactions(txList);
      localDB.saveTransactions(txList);
      return true;
    } else {
      // Optimistic update
      setTransactions(prev => prev.map((tx) => (tx.id === id ? { ...tx, ...updated } : tx)));
      
      const txDocRef = doc(db, "users", user.uid, "transactions", id);
      updateDoc(txDocRef, updated).catch(error => {
        console.error("Edit transaction error:", error);
      });
      
      return true;
    }
  };

  const deleteTransaction = async (id) => {
    if (isDemoMode || !user) {
      const txList = transactions.filter((tx) => tx.id !== id);
      setTransactions(txList);
      localDB.saveTransactions(txList);
      return true;
    } else {
      // Optimistic update
      setTransactions(prev => prev.filter((tx) => tx.id !== id));
      
      const txDocRef = doc(db, "users", user.uid, "transactions", id);
      deleteDoc(txDocRef).catch(error => {
        console.error("Delete transaction error:", error);
      });
      
      return true;
    }
  };

  const updateBudgets = async (newBudgets) => {
    const formattedBudgets = {};
    for (const cat in newBudgets) {
      formattedBudgets[cat] = Number(newBudgets[cat]) || 0;
    }
    
    if (isDemoMode || !user) {
      setBudgets(formattedBudgets);
      localDB.saveBudgets(formattedBudgets);
      return true;
    } else {
      // Optimistic update
      setBudgets(formattedBudgets);
      
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { budgets: formattedBudgets }, { merge: true });
        return true;
      } catch (error) {
        console.error("Update budgets error:", error);
        throw error;
      }
    }
  };

  const updateInitialBalance = async (method, provider, amount) => {
    const updatedBalances = JSON.parse(JSON.stringify(initialBalances));
    const numericAmount = Number(amount);

    if (method === "Cash" || method === "Credit Card") {
      updatedBalances[method] = numericAmount;
    } else {
      if (!updatedBalances[method]) updatedBalances[method] = {};
      updatedBalances[method][provider] = numericAmount;
    }

    if (isDemoMode || !user) {
      setInitialBalances(updatedBalances);
      localDB.saveInitialBalances(updatedBalances);
      return true;
    } else {
      // Optimistic update
      setInitialBalances(updatedBalances);
      
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { initialBalances: updatedBalances }, { merge: true });
        return true;
      } catch (error) {
        console.error("Update initial balance error:", error);
        throw error;
      }
    }
  };

  const saveFinancialGoals = async (goals) => {
    if (isDemoMode || !user) {
      setFinancialGoals(goals);
      localDB.saveFinancialGoals(goals);
      return true;
    }

    setFinancialGoals(goals);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { financialGoals: goals }, { merge: true });
      return true;
    } catch (error) {
      console.error("Save financial goals error:", error);
      throw error;
    }
  };

  const ensureBankAccountBalances = (balances, accountName) => {
    const nextBalances = JSON.parse(JSON.stringify(balances || {}));
    if (!nextBalances["Bank Account"]) nextBalances["Bank Account"] = {};
    if (!nextBalances["Mobile Banking"]) nextBalances["Mobile Banking"] = {};
    if (nextBalances["Bank Account"][accountName] === undefined) nextBalances["Bank Account"][accountName] = 0;
    if (nextBalances["Mobile Banking"][accountName] === undefined) nextBalances["Mobile Banking"][accountName] = 0;
    return nextBalances;
  };

  const addBankAccount = async (accountName) => {
    const normalizedName = accountName.trim();
    if (!normalizedName) throw new Error("Bank account name is required.");

    const isDuplicate = bankAccounts.some((account) => account.name.toLowerCase() === normalizedName.toLowerCase());
    if (isDuplicate) throw new Error("This account name already exists.");

    const nextBankAccounts = [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: normalizedName }, ...bankAccounts];
    const nextBalances = ensureBankAccountBalances(initialBalances, normalizedName);

    if (isDemoMode || !user) {
      setBankAccounts(nextBankAccounts);
      setInitialBalances(nextBalances);
      localDB.saveBankAccounts(nextBankAccounts);
      localDB.saveInitialBalances(nextBalances);
      return true;
    }

    setBankAccounts(nextBankAccounts);
    setInitialBalances(nextBalances);

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { bankAccounts: nextBankAccounts, initialBalances: nextBalances }, { merge: true });
      return true;
    } catch (error) {
      console.error("Add bank account error:", error);
      throw error;
    }
  };

  const updateBankAccount = async (id, accountName) => {
    const normalizedName = accountName.trim();
    if (!normalizedName) throw new Error("Bank account name is required.");

    const existingAccount = bankAccounts.find((account) => account.id === id);
    if (!existingAccount) throw new Error("Bank account not found.");

    const isDuplicate = bankAccounts.some((account) => account.id !== id && account.name.toLowerCase() === normalizedName.toLowerCase());
    if (isDuplicate) throw new Error("This account name already exists.");

    const nextBankAccounts = bankAccounts.map((account) => account.id === id ? { ...account, name: normalizedName } : account);
    const nextBalances = JSON.parse(JSON.stringify(initialBalances || {}));

    if (existingAccount.name !== normalizedName) {
      if (nextBalances["Bank Account"]?.[existingAccount.name] !== undefined) {
        const oldValue = nextBalances["Bank Account"][existingAccount.name];
        nextBalances["Bank Account"][normalizedName] = oldValue;
        delete nextBalances["Bank Account"][existingAccount.name];
      }
      if (nextBalances["Mobile Banking"]?.[existingAccount.name] !== undefined) {
        const oldValue = nextBalances["Mobile Banking"][existingAccount.name];
        nextBalances["Mobile Banking"][normalizedName] = oldValue;
        delete nextBalances["Mobile Banking"][existingAccount.name];
      }
    }

    if (!nextBalances["Bank Account"]) nextBalances["Bank Account"] = {};
    if (!nextBalances["Mobile Banking"]) nextBalances["Mobile Banking"] = {};
    if (nextBalances["Bank Account"][normalizedName] === undefined) nextBalances["Bank Account"][normalizedName] = 0;
    if (nextBalances["Mobile Banking"][normalizedName] === undefined) nextBalances["Mobile Banking"][normalizedName] = 0;

    if (isDemoMode || !user) {
      setBankAccounts(nextBankAccounts);
      setInitialBalances(nextBalances);
      localDB.saveBankAccounts(nextBankAccounts);
      localDB.saveInitialBalances(nextBalances);
      return true;
    }

    setBankAccounts(nextBankAccounts);
    setInitialBalances(nextBalances);

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { bankAccounts: nextBankAccounts, initialBalances: nextBalances }, { merge: true });
      return true;
    } catch (error) {
      console.error("Update bank account error:", error);
      throw error;
    }
  };

  const deleteBankAccount = async (id) => {
    const existingAccount = bankAccounts.find((account) => account.id === id);
    if (!existingAccount) return true;

    const nextBankAccounts = bankAccounts.filter((account) => account.id !== id);
    const nextBalances = JSON.parse(JSON.stringify(initialBalances || {}));

    if (nextBalances["Bank Account"]?.[existingAccount.name] !== undefined) {
      delete nextBalances["Bank Account"][existingAccount.name];
    }
    if (nextBalances["Mobile Banking"]?.[existingAccount.name] !== undefined) {
      delete nextBalances["Mobile Banking"][existingAccount.name];
    }

    if (isDemoMode || !user) {
      setBankAccounts(nextBankAccounts);
      setInitialBalances(nextBalances);
      localDB.saveBankAccounts(nextBankAccounts);
      localDB.saveInitialBalances(nextBalances);
      return true;
    }

    setBankAccounts(nextBankAccounts);
    setInitialBalances(nextBalances);

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { bankAccounts: nextBankAccounts, initialBalances: nextBalances }, { merge: true });
      return true;
    } catch (error) {
      console.error("Delete bank account error:", error);
      throw error;
    }
  };

  // Guaranteed global chronological sorting
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      const createA = new Date(a.createdAt || 0).getTime();
      const createB = new Date(b.createdAt || 0).getTime();
      return createB - createA;
    });
  }, [transactions]);

  // Live Ledger Balance Calculation Layer
  const currentBalances = useMemo(() => {
    if (Object.keys(initialBalances).length === 0) return {};
    
    const computed = JSON.parse(JSON.stringify(initialBalances));
    
    sortedTransactions.forEach((tx) => {
      const amount = Number(tx.amount);
      const method = tx.paymentMethod;
      const provider = tx.provider;
      const isIncome = tx.type === "income";

      if (method === "Cash" || method === "Credit Card") {
        if (computed[method] === undefined) computed[method] = 0;
        if (isIncome) {
          computed[method] += amount;
        } else {
          computed[method] -= amount;
        }
      } else if (method === "Bank Account" || method === "eWallet" || method === "Mobile Banking") {
        if (!computed[method]) computed[method] = {};
        if (provider) {
          if (computed[method][provider] === undefined) {
            computed[method][provider] = 0;
          }
          if (isIncome) {
            computed[method][provider] += amount;
          } else {
            computed[method][provider] -= amount;
          }
        }
      }
    });

    return computed;
  }, [transactions, initialBalances]);

  // Aggregate balance calculations
  const totals = useMemo(() => {
    let totalBalance = 0;
    let bankTotal = 0;
    let walletTotal = 0;
    let mobileBankTotal = 0;
    let cashTotal = currentBalances["Cash"] || 0;
    let creditCardTotal = currentBalances["Credit Card"] || 0;

    // Sum Bank Accounts
    if (currentBalances["Bank Account"]) {
      Object.values(currentBalances["Bank Account"]).forEach(v => bankTotal += Number(v));
    }
    // Sum eWallets
    if (currentBalances["eWallet"]) {
      Object.values(currentBalances["eWallet"]).forEach(v => walletTotal += Number(v));
    }
    // Sum Mobile Banking
    if (currentBalances["Mobile Banking"]) {
      Object.values(currentBalances["Mobile Banking"]).forEach(v => mobileBankTotal += Number(v));
    }

    // Net Assets = Cash + Banks + eWallets + MobileBanking + CreditCard (Credit Card balance reduces assets)
    totalBalance = cashTotal + bankTotal + walletTotal + mobileBankTotal + creditCardTotal;

    return {
      net: totalBalance,
      cash: cashTotal,
      creditCard: creditCardTotal,
      bank: bankTotal,
      wallet: walletTotal,
      mobileBanking: mobileBankTotal
    };
  }, [currentBalances]);

  const value = {
    transactions: sortedTransactions,
    budgets,
    financialGoals,
    initialBalances,
    currentBalances,
    totals,
    loading,
    syncStatus,
    bankAccounts,
    addTransaction,
    editTransaction,
    deleteTransaction,
    updateBudgets,
    saveFinancialGoals,
    updateInitialBalance,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}
