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

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

export const getMonthName = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", { month: "long" });
};
