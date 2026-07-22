import { useState, useMemo } from "react";
import { jsPDF } from "jspdf";
import { useFinance } from "../context/FinanceContext";
import { useCalendar } from "../context/CalendarContext";
import { formatCurrency, formatDate } from "../utils/helpers";
import { CATEGORIES, PAYMENT_METHODS } from "../utils/constants";
import { 
  Search, 
  Edit2, 
  Trash2, 
  AlertCircle,
  X,
  SlidersHorizontal,
  Download,
  FileText
} from "lucide-react";
import AddTransactionModal from "../components/transactions/AddTransactionModal";

const escapeCsvValue = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const pdfSafeText = (value) => String(value ?? "").replace(/[^\x20-\x7E]/g, "?");

export default function History() {
  const { transactions, deleteTransaction } = useFinance();
  const { dateSystem } = useCalendar();
  
  // Filters & Search State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  
  // Modal State
  const [editingTx, setEditingTx] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Filter and Search logic
  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const minimum = minAmount === "" ? null : Number(minAmount);
    const maximum = maxAmount === "" ? null : Number(maxAmount);

    return transactions.filter((tx) => {
      const matchesSearch = 
        !normalizedSearch ||
        (tx.notes && tx.notes.toLowerCase().includes(normalizedSearch)) ||
        (tx.category && tx.category.toLowerCase().includes(normalizedSearch)) ||
        (tx.provider && tx.provider.toLowerCase().includes(normalizedSearch)) ||
        (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(normalizedSearch));
      
      const matchesCategory = selectedCategory === "all" || tx.category === selectedCategory;
      const matchesMethod = selectedMethod === "all" || tx.paymentMethod === selectedMethod;
      const matchesType = selectedType === "all" || tx.type === selectedType;
      const matchesStartDate = !startDate || (tx.date && tx.date >= startDate);
      const matchesEndDate = !endDate || (tx.date && tx.date <= endDate);
      const amount = Number(tx.amount);
      const matchesMinAmount = minimum === null || (!Number.isNaN(minimum) && amount >= minimum);
      const matchesMaxAmount = maximum === null || (!Number.isNaN(maximum) && amount <= maximum);

      return matchesSearch && matchesCategory && matchesMethod && matchesType && matchesStartDate && matchesEndDate && matchesMinAmount && matchesMaxAmount;
    });
  }, [transactions, search, selectedCategory, selectedMethod, selectedType, startDate, endDate, minAmount, maxAmount]);

  const handleEditTrigger = (tx) => {
    setEditingTx(tx);
    setIsEditOpen(true);
  };

  const handleDeleteTrigger = (id) => {
    setDeleteTargetId(id);
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedMethod("all");
    setSelectedType("all");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
  };

  const hasActiveFilters = 
    selectedCategory !== "all" || 
    selectedMethod !== "all" || 
    selectedType !== "all" ||
    startDate !== "" ||
    endDate !== "" ||
    minAmount !== "" ||
    maxAmount !== "" ||
    search !== "";

  const exportFileName = `kharchaflow-transactions-${new Date().toISOString().slice(0, 10)}`;

  const downloadCsv = () => {
    const headers = ["Date", "Type", "Category", "Payment Method", "Provider", "Amount", "Notes"];
    const rows = filteredTransactions.map((tx) => [
      formatDate(tx.date, dateSystem),
      tx.type,
      tx.category,
      tx.paymentMethod,
      tx.provider,
      Number(tx.amount) || 0,
      tx.notes
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const income = filteredTransactions.filter((tx) => tx.type === "income").reduce((total, tx) => total + (Number(tx.amount) || 0), 0);
    const expenses = filteredTransactions.filter((tx) => tx.type === "expense").reduce((total, tx) => total + (Number(tx.amount) || 0), 0);
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 16;

    const addHeader = (showSummary = false) => {
      doc.setTextColor(24, 24, 27);
      doc.setFontSize(18);
      doc.text("KharchaFlow Transaction Report", 14, y);
      doc.setFontSize(9);
      doc.setTextColor(82, 82, 91);
      doc.text(`Generated ${formatDate(new Date().toISOString().slice(0, 10), dateSystem)}`, pageWidth - 14, y, { align: "right" });
      y += 7;
      if (showSummary) {
        doc.text(`Entries: ${filteredTransactions.length} | Income: ${formatCurrency(income)} | Expenses: ${formatCurrency(expenses)} | Net: ${formatCurrency(income - expenses)}`, 14, y);
        y += 9;
      }
      doc.setDrawColor(212, 212, 216);
      doc.line(14, y, pageWidth - 14, y);
      y += 6;
      doc.setFontSize(8);
      doc.setTextColor(63, 63, 70);
      doc.text("DATE", 14, y);
      doc.text("TYPE", 42, y);
      doc.text("CATEGORY", 65, y);
      doc.text("PAYMENT METHOD", 100, y);
      doc.text("NOTES", 148, y);
      doc.text("AMOUNT", pageWidth - 14, y, { align: "right" });
      y += 5;
      doc.line(14, y, pageWidth - 14, y);
      y += 5;
    };

    addHeader(true);
    doc.setFontSize(8);
    filteredTransactions.forEach((tx, index) => {
      if (y > 190) {
        doc.addPage();
        y = 16;
        addHeader();
        doc.setFontSize(8);
      }
      const isIncome = tx.type === "income";
      doc.setTextColor(63, 63, 70);
      doc.text(pdfSafeText(formatDate(tx.date, dateSystem)), 14, y);
      doc.setTextColor(isIncome ? 5 : 190, isIncome ? 150 : 24, isIncome ? 105 : 93);
      doc.text(isIncome ? "Income" : "Expense", 42, y);
      doc.setTextColor(63, 63, 70);
      doc.text(pdfSafeText(tx.category).slice(0, 18), 65, y);
      doc.text(pdfSafeText(`${tx.paymentMethod}${tx.provider ? ` - ${tx.provider}` : ""}`).slice(0, 28), 100, y);
      doc.text(pdfSafeText(tx.notes || "No details").slice(0, 52), 148, y);
      doc.setTextColor(isIncome ? 5 : 190, isIncome ? 150 : 24, isIncome ? 105 : 93);
      doc.text(`${isIncome ? "+" : "-"}${formatCurrency(tx.amount)}`, pageWidth - 14, y, { align: "right" });
      y += 7;
      if (index < filteredTransactions.length - 1) {
        doc.setDrawColor(244, 244, 245);
        doc.line(14, y - 3.5, pageWidth - 14, y - 3.5);
      }
    });
    doc.save(`${exportFileName}.pdf`);
  };

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
        <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 ${showFiltersMobile ? "grid" : "hidden md:grid"}`}>
          {/* Date Range Filters */}
          <div>
            <label htmlFor="start-date-filter" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5 ml-0.5">From Date</label>
            <input
              id="start-date-filter"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate || undefined}
              className="finance-input py-2.5 text-xs font-semibold"
            />
          </div>

          <div>
            <label htmlFor="end-date-filter" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5 ml-0.5">To Date</label>
            <input
              id="end-date-filter"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              className="finance-input py-2.5 text-xs font-semibold"
            />
          </div>
          
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
              {Object.keys(PAYMENT_METHODS).map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {/* Transaction Type Filter */}
          <div>
            <label htmlFor="type-filter" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5 ml-0.5">Transaction Type</label>
            <select
              id="type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="finance-input py-2.5 text-xs font-semibold"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Amount Range Filters */}
          <div>
            <label htmlFor="min-amount-filter" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5 ml-0.5">Minimum Amount</label>
            <input
              id="min-amount-filter"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="No minimum"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="finance-input py-2.5 text-xs font-semibold"
            />
          </div>

          <div>
            <label htmlFor="max-amount-filter" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5 ml-0.5">Maximum Amount</label>
            <input
              id="max-amount-filter"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="No maximum"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="finance-input py-2.5 text-xs font-semibold"
            />
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
          <div className="flex items-center gap-2">
            <button
              onClick={downloadCsv}
              disabled={filteredTransactions.length === 0}
              className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 hover:text-emerald-400 text-[10px] font-bold flex items-center gap-1.5 transition-colors"
              title="Export visible transactions as CSV"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={downloadPdf}
              disabled={filteredTransactions.length === 0}
              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 text-[10px] font-bold flex items-center gap-1.5 transition-colors"
              title="Export visible transactions as PDF"
            >
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
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
                        <td className="py-4.5 text-zinc-400 font-medium pl-2">{formatDate(tx.date, dateSystem)}</td>
                        
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
                        <span>{formatDate(tx.date, dateSystem)}</span>
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

      {/* Custom Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={() => setDeleteTargetId(null)}></div>
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative z-10 animate-slide-up">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white mb-2">Confirm Transaction Deletion</h3>
                <p className="text-xs text-zinc-450 leading-relaxed mb-6">
                  Are you sure you want to permanently delete this transaction? This action is irreversible and the transaction record will be permanently removed from your history ledger.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setDeleteTargetId(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const id = deleteTargetId;
                      setDeleteTargetId(null);
                      try {
                        await deleteTransaction(id);
                        setShowSuccessToast(true);
                        setTimeout(() => setShowSuccessToast(false), 3000);
                      } catch (err) {
                        console.error("Delete failed: ", err);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-md hover:shadow-rose-500/20"
                  >
                    Delete Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xl max-w-sm animate-slide-up">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h5 className="text-xs font-bold text-white">Transaction Record Deleted</h5>
            <p className="text-[10px] text-zinc-400 font-medium mt-0.5">The selected transaction record has been successfully and permanently deleted.</p>
          </div>
        </div>
      )}
    </div>
  );
}
