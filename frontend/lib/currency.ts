/**
 * Currency utility for BudgetAI
 * Supports multiple currencies with proper formatting
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
];

export const DEFAULT_CURRENCY = 'USD';

/**
 * Get currency info by code
 */
export function getCurrencyInfo(code: string): CurrencyInfo {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code) || SUPPORTED_CURRENCIES[1]; // Default to USD
}

/**
 * Format amount with proper currency formatting
 * Uses Intl.NumberFormat for locale-aware formatting
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY,
  options: {
    compact?: boolean;
    showSymbol?: boolean;
    decimals?: number;
  } = {}
): string {
  const { compact = false, showSymbol = true, decimals } = options;
  const currency = getCurrencyInfo(currencyCode);

  try {
    const formatOptions: Intl.NumberFormatOptions = {
      style: showSymbol ? 'currency' : 'decimal',
      currency: currency.code,
      minimumFractionDigits: decimals ?? (currency.code === 'JPY' ? 0 : 2),
      maximumFractionDigits: decimals ?? (currency.code === 'JPY' ? 0 : 2),
    };

    if (compact && Math.abs(amount) >= 1000) {
      formatOptions.notation = 'compact';
      formatOptions.compactDisplay = 'short';
    }

    return new Intl.NumberFormat(currency.locale, formatOptions).format(amount);
  } catch (error) {
    // Fallback formatting
    const symbol = showSymbol ? currency.symbol : '';
    const formatted = amount.toFixed(currency.code === 'JPY' ? 0 : 2);
    return `${symbol}${formatted}`;
  }
}

/**
 * Format amount for display in a compact form (e.g., $1.5K, ₹2.3L)
 */
export function formatCompactCurrency(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  return formatCurrency(amount, currencyCode, { compact: true });
}

/**
 * Format amount without currency symbol (just number with locale formatting)
 */
export function formatAmount(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  return formatCurrency(amount, currencyCode, { showSymbol: false });
}

/**
 * Get just the currency symbol
 */
export function getCurrencySymbol(currencyCode: string = DEFAULT_CURRENCY): string {
  return getCurrencyInfo(currencyCode).symbol;
}

/**
 * Parse a formatted currency string back to number
 */
export function parseCurrencyString(value: string): number {
  // Remove all non-numeric characters except decimal point and minus
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Get currency options for dropdown
 */
export function getCurrencyOptions(): Array<{ value: string; label: string; symbol: string }> {
  return SUPPORTED_CURRENCIES.map((c) => ({
    value: c.code,
    label: `${c.symbol} ${c.code} – ${c.name}`,
    symbol: c.symbol,
  }));
}

/**
 * Validate if a currency code is supported
 */
export function isValidCurrency(code: string): boolean {
  return SUPPORTED_CURRENCIES.some((c) => c.code === code);
}
