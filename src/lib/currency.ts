export type CurrencyCode = 'IDR' | 'USD' | 'AUD' | 'EUR' | 'SGD';

export type CurrencyOption = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  decimalPlaces: number;
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩', decimalPlaces: 0 },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', decimalPlaces: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', decimalPlaces: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', decimalPlaces: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', decimalPlaces: 2 },
];

export function normalizeCurrency(value?: string | null): CurrencyCode {
  const code = String(value ?? 'IDR').toUpperCase();
  return CURRENCY_OPTIONS.some((item) => item.code === code) ? code as CurrencyCode : 'IDR';
}

export function getCurrencyOption(value?: string | null) {
  const code = normalizeCurrency(value);
  return CURRENCY_OPTIONS.find((item) => item.code === code) ?? CURRENCY_OPTIONS[0];
}

export function formatPrice(
  amount: number,
  currency?: string | null,
  locale = 'id-ID',
) {
  const option = getCurrencyOption(currency);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: option.code,
    minimumFractionDigits: option.decimalPlaces,
    maximumFractionDigits: option.decimalPlaces,
  }).format(amount);
}

export type PricesMap = Record<string, number>;

export function formatMultiPrice(prices: PricesMap): string {
  return Object.entries(prices)
    .filter(([, v]) => v > 0)
    .map(([code, amount]) => formatPrice(amount, code))
    .join(' / ');
}
