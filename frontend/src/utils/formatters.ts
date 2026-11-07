export const formatCurrency = (amount: string | number | undefined | null, currency: string = 'INR'): string => {
  if (amount === undefined || amount === null || amount === '') return '₹0.00';
  const rawStr = String(amount).replace(/₹|\$|,/g, '').trim();
  const num = parseFloat(rawStr);
  const symbol = (currency === 'USD' || currency === '$') ? '$' : '₹';
  if (isNaN(num)) return `${symbol}0.00`;
  return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  return dateStr.replace('T', ' ').slice(0, 19);
};

