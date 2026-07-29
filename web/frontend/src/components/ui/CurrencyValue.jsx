import { formatCurrency } from "../../utils/helpers";

/**
 * Shared monetary value presentation.
 * Keeps currency values aligned, readable, and accessible when space is tight.
 */
export default function CurrencyValue({ value, currencyCode, sign = "", className = "" }) {
  const formattedValue = formatCurrency(value, currencyCode);

  return (
    <span
      className={`currency-value ${className}`.trim()}
      title={`${sign}${formattedValue}`}
    >
      {sign}{formattedValue}
    </span>
  );
}
