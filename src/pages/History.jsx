import { useState, useMemo } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, formatDate } from "../utils/helpers";
import { CATEGORIES } from "../utils/constants";
import { 
  Search, 
  Edit2, 
  Trash2, 
  AlertCircle,
  X,
  SlidersHorizontal
} from "lucide-react";
import AddTransactionModal from "../components/transactions/AddTransactionModal";

export default function History() {
  const { transactions, deleteTransaction } = useFinance();
  
  // Filters & Search State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  
  // Modal State
  const [editingTx, setEditingTx] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Extract all unique months that have transactions for the filter dropdown
  const uniqueMonths = useMemo(() => {
    const months = new Set();
    transactions.forEach((tx) => {
      if (tx.date) {
        months.add(tx.date.slice(0, 7)); // YYYY-MM
      }
    });
    return Array.from(months).sort().reverse(); // Show latest months first
  }, [transactions]);

  // Filter and Search logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch = 
        (tx.notes && tx.notes.toLowerCase().includes(search.toLowerCase())) ||
        (tx.category && tx.category.toLowerCase().includes(search.toLowerCase())) ||
        (tx.provider && tx.provider.toLowerCase().includes(search.toLowerCase()));
      
      const matchesCategory = selectedCategory === "all" || tx.category === selectedCategory;
      const matchesMethod = selectedMethod === "all" || tx.paymentMethod === selectedMethod;
      const matchesMonth = selectedMonth === "all" || tx.date.startsWith(selectedMonth);

      return matchesSearch && matchesCategory && matchesMethod && matchesMonth;
    });
  }, [transactions, search, selectedCategory, selectedMethod, selectedMonth]);

  const handleEditTrigger = (tx) => {
    setEditingTx(tx);
    setIsEditOpen(true);
  };

  const handleDeleteTrigger = async (id) => {
    if (confirm("Are you sure you want to permanently delete this transaction?")) {
      try {
        await deleteTransaction(id);
      } catch (err) {
        console.error("Delete failed: ", err);
      }
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedMethod("all");
    setSelectedMonth("all");
  };

  const hasActiveFilters = 
    selectedCategory !== "all" || 
    selectedMethod !== "all" || 
    selectedMonth !== "all" ||
    search !== "";

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      
      {/* 1. Filter Control Panel */}
      <div className="finance-card space-y-4">
        
        {/* Search and mobile filters toggles */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by notes, category, bank, wallet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="finance-input pl-10 pr-4 py-2.5 text-sm"
            />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
          </div>
          
          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="md:hidden px-3.5 bg-zinc-950 border border-zinc-850 hover:border-zinc-800 text-zinc-300 rounded-xl flex items-center justify-center transition-colors"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
          </button>
        </div>

        {/* Filters Row */}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-3 ${showFiltersMobile ? "block" : "hidden md:grid"}`}>
          
          {/* Category Filter */}
          <div>
            <label htmlFor="cat-filter" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5 ml-0.5">Category</label>
            <select
              id="cat-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="finance-input py-2.5 text-xs font-semibold"
            >
              <option value="all">All Categories</option>
              {Object.keys(CATEGORIES).map((catName) => (
                <option key={catName} value={catName}>{catName}</option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label htmlFor="method-filter" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5 ml-0.5">Source Method</label>
            <select
              id="method-filter"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="finance-input py-2.5 text-xs font-semibold"
            >
              <option value="all">All Sources</option>
              <option value="Cash">Cash</option>
              <option value="Bank Account">Bank Account</option>
              <option value="eWallet">eWallet</option>
              <option value="Mobile Banking">Mobile Banking</option>
              <option value="Credit Card">Credit Card</option>
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label htmlFor="month-filter" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5 ml-0.5">Billing Month</label>
            <select
              id="month-filter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="finance-input py-2.5 text-xs font-semibold"
            >
              <option value="all">All Months</option>
              {uniqueMonths.map((m) => {
                const [year, month] = m.split("-");
                const label = new Date(year, month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
                return <option key={m} value={m}>{label}</option>;
              })}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}
          </div>

        </div>

      </div>

      {/* 2. Responsive Ledger Results */}
      <div className="finance-card overflow-hidden">
        
        {/* Header summary */}
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4 mb-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight uppercase">Ledger Entries</h4>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">
              Showing {filteredTransactions.length} of {transactions.length} total entries
            </p>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center text-center gap-2">
            <AlertCircle className="w-9 h-9 text-zinc-700 animate-pulse" />
            <h5 className="text-sm font-semibold text-zinc-400">No matching transactions found</h5>
            <p className="text-xs text-zinc-650 max-w-sm">
              We couldn't find any results. Try altering your filters or clearing search criteria.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-2 text-xs font-bold text-emerald-400 hover:underline"
              >
                Clear all active filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    <th className="pb-3.5 pl-2">Date</th>
                    <th className="pb-3.5">Notes</th>
                    <th className="pb-3.5">Category</th>
                    <th className="pb-3.5">Payment Source</th>
                    <th className="pb-3.5">Flow Type</th>
                    <th className="pb-3.5 text-right pr-2">Amount</th>
                    <th className="pb-3.5 text-center pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/40 text-xs">
                  {filteredTransactions.map((tx) => {
                    const isIncome = tx.type === "income";
                    const catInfo = CATEGORIES[tx.category] || CATEGORIES.Others;
                    
                    return (
                      <tr key={tx.id} className="hover:bg-zinc-950/30 transition-colors group">
                        {/* Date */}
                        <td className="py-4.5 text-zinc-400 font-medium pl-2">{formatDate(tx.date)}</td>
                        
                        {/* Notes */}
                        <td className="py-4.5 font-bold text-zinc-200 max-w-xs truncate">
                          {tx.notes || <span className="text-zinc-600 font-normal italic">No details</span>}
                        </td>
                        
                        {/* Category */}
                        <td className="py-4.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catInfo.bgClass}`}>
                            {tx.category}
                          </span>
                        </td>
                        
                        {/* Payment Source */}
                        <td className="py-4.5 text-zinc-400 font-medium">
                          {tx.paymentMethod} {tx.provider && <span className="text-[10px] text-zinc-500">({tx.provider})</span>}
                        </td>
                        
                        {/* Flow Type */}
                        <td className="py-4.5">
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${isIncome ? "text-emerald-400" : "text-zinc-500"}`}>
                            {tx.type}
                          </span>
                        </td>
                        
                        {/* Amount */}
                        <td className={`py-4.5 text-right font-bold pr-2 ${isIncome ? "text-emerald-400" : "text-zinc-200"}`}>
                          {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                        </td>
                        
                        {/* Actions */}
                        <td className="py-4.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditTrigger(tx)}
                              className="text-zinc-500 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-zinc-950 border border-transparent hover:border-zinc-800 transition-all outline-none"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTrigger(tx.id)}
                              className="text-zinc-650 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-950 border border-transparent hover:border-zinc-800 transition-all outline-none"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stack Cards View */}
            <div className="md:hidden space-y-3">
              {filteredTransactions.map((tx) => {
                const isIncome = tx.type === "income";
                const catInfo = CATEGORIES[tx.category] || CATEGORIES.Others;
                
                return (
                  <div 
                    key={tx.id} 
                    className="bg-zinc-950/40 border border-zinc-850/60 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border leading-none mb-1.5 ${catInfo.bgClass}`}>
                          {tx.category}
                        </span>
                        <h5 className="text-xs font-bold text-zinc-200">
                          {tx.notes || <span className="text-zinc-600 font-normal italic">No details</span>}
                        </h5>
                      </div>
                      <span className={`text-xs font-bold ${isIncome ? "text-emerald-400" : "text-zinc-300"}`}>
                        {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-zinc-500 font-semibold border-t border-zinc-850/50 pt-2.5">
                      <div>
                        <span>{formatDate(tx.date)}</span>
                        <span className="mx-1.5">•</span>
                        <span className="text-zinc-400">
                          {tx.paymentMethod} {tx.provider && `(${tx.provider})`}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTrigger(tx)}
                          className="text-zinc-450 hover:text-emerald-400 p-1 border border-zinc-800 rounded bg-zinc-950 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrigger(tx.id)}
                          className="text-zinc-450 hover:text-rose-450 p-1 border border-zinc-800 rounded bg-zinc-950 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* Edit Drawer Integration */}
      <AddTransactionModal 
        isOpen={isEditOpen} 
        onClose={() => {
          setIsEditOpen(false);
          setEditingTx(null);
        }} 
        editingTransaction={editingTx}
      />
    </div>
  );
}
