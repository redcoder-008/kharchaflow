import { 
  Utensils, 
  Car, 
  ShoppingBag, 
  FileText, 
  Film, 
  BookOpen, 
  HeartPulse, 
  HelpCircle, 
  DollarSign,
  Wallet,
  Smartphone,
  Landmark,
  CreditCard,
  Coins
} from "lucide-react";

export const CATEGORIES = {
  Food: {
    name: "Food",
    icon: Utensils,
    color: "emerald",
    bgClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    colorHex: "#10b981"
  },
  Transport: {
    name: "Transport",
    icon: Car,
    color: "blue",
    bgClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    colorHex: "#3b82f6"
  },
  Shopping: {
    name: "Shopping",
    icon: ShoppingBag,
    color: "purple",
    bgClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    colorHex: "#a855f7"
  },
  Bills: {
    name: "Bills",
    icon: FileText,
    color: "amber",
    bgClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    colorHex: "#f59e0b"
  },
  Entertainment: {
    name: "Entertainment",
    icon: Film,
    color: "rose",
    bgClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    colorHex: "#f43f5e"
  },
  Education: {
    name: "Education",
    icon: BookOpen,
    color: "indigo",
    bgClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    colorHex: "#6366f1"
  },
  Health: {
    name: "Health",
    icon: HeartPulse,
    color: "red",
    bgClass: "bg-red-500/10 text-red-400 border-red-500/20",
    colorHex: "#ef4444"
  },
  Others: {
    name: "Others",
    icon: HelpCircle,
    color: "zinc",
    bgClass: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    colorHex: "#71717a"
  },
  Income: {
    name: "Income",
    icon: DollarSign,
    color: "emerald",
    bgClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    colorHex: "#10b981"
  }
};

export const PAYMENT_METHODS = {
  "Cash": {
    name: "Cash",
    icon: Coins,
    color: "amber",
    bgClass: "bg-amber-500/10 text-amber-400"
  },
  "eWallet": {
    name: "eWallet",
    icon: Wallet,
    color: "indigo",
    bgClass: "bg-indigo-500/10 text-indigo-400"
  },
  "Mobile Banking": {
    name: "Mobile Banking",
    icon: Smartphone,
    color: "emerald",
    bgClass: "bg-emerald-500/10 text-emerald-400"
  },
  "Bank Account": {
    name: "Bank Account",
    icon: Landmark,
    color: "blue",
    bgClass: "bg-blue-500/10 text-blue-400"
  },
  "Credit Card": {
    name: "Credit Card",
    icon: CreditCard,
    color: "rose",
    bgClass: "bg-rose-500/10 text-rose-400"
  }
};

export const EWALLET_PROVIDERS = [
  "eSewa",
  "Khalti",
  "IME Pay"
];

export const BANK_PROVIDERS = [
  "Global IME Bank",
  "Nabil Bank",
  "NIC Asia Bank",
  "Prabhu Bank",
  "Everest Bank"
];
