import NepaliDateModule from "nepali-date-converter";

// The package's ESM build wraps its constructor in a default property.
const NepaliDate = NepaliDateModule.default || NepaliDateModule;

const DEFAULT_CURRENCY = "INR";
const CURRENCY_LOCALES = {
  INR: "en-IN",
  NPR: "en-NP",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
  AUD: "en-AU",
  JPY: "ja-JP",
  CAD: "en-CA",
  SGD: "en-SG",
  CNY: "zh-CN"
};

const getStoredCurrency = () => {
  if (typeof window === "undefined") return DEFAULT_CURRENCY;
  const fromStorage = window.localStorage.getItem("kharchaflow_currency");
  return fromStorage && /^[A-Z]{3}$/.test(fromStorage) ? fromStorage : DEFAULT_CURRENCY;
};

export const getPreferredCurrency = () => getStoredCurrency();

export const formatCurrency = (value, currencyCode = getPreferredCurrency()) => {
  const number = Number(value);
  const locale = CURRENCY_LOCALES[currencyCode] || "en-US";
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (isNaN(number)) return formatter.format(0);
  return formatter.format(number);
};

const parseStoredDate = (dateString) => new Date(`${dateString}T12:00:00`);

const formatNepaliDate = (dateString, options = {}) => {
  try {
    const date = new NepaliDate(parseStoredDate(dateString));
    const { year, date: day } = date.getBS();
    const monthName = date.format("MMMM");
    return options.monthOnly ? monthName : `${day} ${monthName} ${year}`;
  } catch {
    return "";
  }
};

export const formatDate = (dateString, dateSystem = "gregorian") => {
  if (!dateString) return "";
  const date = parseStoredDate(dateString);
  if (isNaN(date.getTime())) return dateString;

  if (dateSystem === "nepali") {
    return formatNepaliDate(dateString) || dateString;
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

export const formatWeekday = (dateString, dateSystem = "gregorian") => {
  if (!dateString) return "";
  const date = parseStoredDate(dateString);
  if (isNaN(date.getTime())) return dateString;

  if (dateSystem === "nepali") {
    try {
      return new NepaliDate(date).format("ddd");
    } catch {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    }
  }

  return date.toLocaleDateString("en-US", { weekday: "short" });
};

export const getMonthName = (dateString) => {
  if (!dateString) return "";
  const date = parseStoredDate(dateString);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", { month: "long" });
};

export const formatMonth = (dateString, dateSystem = "gregorian", short = false) => {
  if (!dateString) return "";
  if (dateSystem === "nepali") {
    try {
      const date = new NepaliDate(parseStoredDate(dateString));
      const { year } = date.getBS();
      return short ? date.format("MMM") : `${date.format("MMMM")} ${year}`;
    } catch {
      return dateString;
    }
  }

  const date = parseStoredDate(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", short
    ? { month: "short" }
    : { month: "long", year: "numeric" });
};

export const toNepaliDateInput = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new NepaliDate(parseStoredDate(dateString));
    const { year, month, date: day } = date.getBS();
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  } catch {
    return "";
  }
};

export const nepaliDateInputToIso = (dateString) => {
  try {
    const nepaliDate = new NepaliDate(dateString);
    const date = nepaliDate.toJsDate();
    if (isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
};
