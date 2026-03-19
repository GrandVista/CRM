/**
 * Convert a number to English words for currency amount.
 * Used for "Total in Words" on contracts (e.g. USD 4455.00).
 *
 * Example: 4455.00 → "Four Thousand Four Hundred Fifty Five"
 * With currency: "U.S. Dollars Four Thousand Four Hundred Fifty Five Only"
 */

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function hundreds(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return TENS[t] + (o > 0 ? " " + ONES[o] : "");
  }
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return ONES[h] + " Hundred" + (rest > 0 ? " " + hundreds(rest) : "");
}

function chunkToWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const billions = Math.floor(n / 1_000_000_000);
  if (billions > 0) {
    parts.push(hundreds(billions) + " Billion");
  }
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  if (millions > 0) {
    parts.push(hundreds(millions) + " Million");
  }
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  if (thousands > 0) {
    parts.push(hundreds(thousands) + " Thousand");
  }
  const rest = n % 1_000;
  if (rest > 0) {
    parts.push(hundreds(rest));
  }
  return parts.join(" ");
}

/**
 * Convert amount (number) to English words for integer part only.
 * Decimals are typically omitted in "Total in Words" or can be appended (e.g. "and 00/100").
 */
export function numberToEnglishWords(amount: number): string {
  const clamped = Math.max(0, Math.min(amount, 999_999_999_999.99));
  const integerPart = Math.floor(clamped);
  const decimalPart = Math.round((clamped - integerPart) * 100);
  const words = chunkToWords(integerPart);
  if (decimalPart === 0) {
    return words;
  }
  return words + " And " + String(decimalPart).padStart(2, "0") + "/100";
}

const CURRENCY_NAMES: Record<string, string> = {
  USD: "U.S. Dollars",
  EUR: "Euros",
  CNY: "Chinese Yuan",
  GBP: "British Pounds",
};

/**
 * Format amount for "Total in Words" on contract.
 * Example: (4455, "USD") → "U.S. Dollars Four Thousand Four Hundred Fifty Five Only"
 */
export function amountToWords(amount: number, currency: string = "USD"): string {
  const name = CURRENCY_NAMES[currency] ?? currency;
  const words = numberToEnglishWords(amount);
  return `${name} ${words} Only`;
}
