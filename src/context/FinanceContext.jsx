import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { localDB } from "../db/storage";
import { db } from "../db/firebase";
import { 
  collection, 
  query, 
  where, 
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
  const [initialBalances, setInitialBalances] = useState({});
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
      setInitialBalances(localDB.getInitialBalances());
      setLoading(false);
      return;
    }

    if (!user) {
      setTransactions([]);
      setBudgets({});
      setInitialBalances({});
      setLoading(false);
      return;
    }

    // Clear state before live sync to prevent data leakage from previous users
    setTransactions([]);
    setBudgets({});
    setInitialBalances({});

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
        if (data.initialBalances) setInitialBalances(data.initialBalances);
      } else {
        // Fallback: Seed unified document
        const defaultBudgets = localDB.getDefaultBudgets();
        const defaultBalances = localDB.getDefaultInitialBalances();
        setDoc(userDocRef, {
          budgets: defaultBudgets,
          initialBalances: defaultBalances
        }, { merge: true });
        setBudgets(defaultBudgets);
        setInitialBalances(defaultBalances);
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
      
      try {
        const docRef = await addDoc(collection(db, "users", user.uid, "transactions"), txToSave);
        return docRef.id;
      } catch (error) {
        // Revert optimistic update on error
        setTransactions(prev => prev.filter(tx => tx.id !== tempId));
        console.error("Add transaction error:", error);
        throw error;
      }
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
      
      try {
        const txDocRef = doc(db, "users", user.uid, "transactions", id);
        await updateDoc(txDocRef, updated);
        return true;
      } catch (error) {
        console.error("Edit transaction error:", error);
        throw error;
      }
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
      
      try {
        const txDocRef = doc(db, "users", user.uid, "transactions", id);
        await deleteDoc(txDocRef);
        return true;
      } catch (error) {
        console.error("Delete transaction error:", error);
        throw error;
      }
    }
  };

  const updateBudget = async (category, amount) => {
    const updatedBudgets = { ...budgets, [category]: Number(amount) };
    
    if (isDemoMode || !user) {
      setBudgets(updatedBudgets);
      localDB.saveBudgets(updatedBudgets);
      return true;
    } else {
      // Optimistic update
      setBudgets(updatedBudgets);
      
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { budgets: updatedBudgets }, { merge: true });
        return true;
      } catch (error) {
        console.error("Update budget error:", error);
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

  // Live Ledger Balance Calculation Layer
  const currentBalances = useMemo(() => {
    if (Object.keys(initialBalances).length === 0) return {};
    
    const computed = JSON.parse(JSON.stringify(initialBalances));
    
    transactions.forEach((tx) => {
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
    transactions,
    budgets,
    initialBalances,
    currentBalances,
    totals,
    loading,
    syncStatus,
    addTransaction,
    editTransaction,
    deleteTransaction,
    updateBudget,
    updateInitialBalance
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}
