/** Format integer minor units (pence/cents) in the room's currency. All supported currencies use 2 decimals. */
export const money = (minor, currency = 'GBP') =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(minor / 100);

export const currencySymbol = (currency = 'GBP') =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).formatToParts(0).find((p) => p.type === 'currency').value;

export const CURRENCIES = ['GBP', 'EUR', 'USD', 'BRL', 'CAD', 'AUD', 'CHF', 'INR'];

export const dayLabel = (timestamp) =>
  new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
