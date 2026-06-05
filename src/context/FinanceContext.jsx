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

  // Load configuration & data
  useEffect(() => {
    if (isDemoMode || !user) {
      // LocalStorage Demo Mode Data Sync
      setTransactions(localDB.getTransactions());
      setBudgets(localDB.getBudgets());
      setInitialBalances(localDB.getInitialBalances());
      setLoading(false);
      return;
    }

    // Live Firebase Firestore Sync
    if (!db) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Transactions Listener
    const txQuery = query(
      collection(db, "transactions"),
      where("uid", "==", user.uid),
      orderBy("date", "desc")
    );

    const unsubscribeTx = onSnapshot(txQuery, (snapshot) => {
      const txList = [];
      snapshot.forEach((doc) => {
        txList.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(txList);
    }, (err) => {
      console.error("Firestore transactions error: ", err);
    });

    // 2. Budgets Listener
    const budgetDocRef = doc(db, "users", user.uid, "config", "budgets");
    const unsubscribeBudget = onSnapshot(budgetDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setBudgets(docSnap.data());
      } else {
        // Seed default budgets in Firestore
        const defaultBudgets = localDB.getBudgets();
        setDoc(budgetDocRef, defaultBudgets);
        setBudgets(defaultBudgets);
      }
    });

    // 3. Initial Balances Listener
    const balanceDocRef = doc(db, "users", user.uid, "config", "initialBalances");
    const unsubscribeBalances = onSnapshot(balanceDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setInitialBalances(docSnap.data());
      } else {
        // Seed default initial balances in Firestore
        const defaultBalances = localDB.getInitialBalances();
        setDoc(balanceDocRef, defaultBalances);
        setInitialBalances(defaultBalances);
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore initial balances error: ", err);
      setLoading(false);
    });

    return () => {
      unsubscribeTx();
      unsubscribeBudget();
      unsubscribeBalances();
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
      const docRef = await addDoc(collection(db, "transactions"), txToSave);
      return docRef.id;
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
      const txDocRef = doc(db, "transactions", id);
      await updateDoc(txDocRef, updated);
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
      const txDocRef = doc(db, "transactions", id);
      await deleteDoc(txDocRef);
      return true;
    }
  };

  const updateBudget = async (category, amount) => {
    const updatedBudgets = { ...budgets, [category]: Number(amount) };
    
    if (isDemoMode || !user) {
      setBudgets(updatedBudgets);
      localDB.saveBudgets(updatedBudgets);
      return true;
    } else {
      const budgetDocRef = doc(db, "users", user.uid, "config", "budgets");
      await setDoc(budgetDocRef, updatedBudgets);
      return true;
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
      const balanceDocRef = doc(db, "users", user.uid, "config", "initialBalances");
      await setDoc(balanceDocRef, updatedBalances);
      return true;
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
    addTransaction,
    editTransaction,
    deleteTransaction,
    updateBudget,
    updateInitialBalance
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}
