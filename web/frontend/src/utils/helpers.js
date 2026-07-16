import NepaliDateModule from "nepali-date-converter";

// The package's ESM build wraps its constructor in a default property.
const NepaliDate = NepaliDateModule.default || NepaliDateModule;

export const formatCurrency = (value) => {
  const number = Number(value);
  if (isNaN(number)) return "Rs. 0.00";
  
  // Format with localized thousands separator and fixed decimals
  const formatted = Math.abs(number).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `Rs. ${number < 0 ? "-" : ""}${formatted}`;
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
