export function formatCurrency(amount, symbol = '₹') {
  if (isNaN(amount) || amount === null || amount === undefined) return `${symbol}0`;
  return `${symbol}${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateISO(date) {
  const d = typeof date === 'string' ? new Date(date) : (date || new Date());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function generateQuoteNumber(existingCount = 0) {
  const year = new Date().getFullYear();
  const num = String(existingCount + 1).padStart(4, '0');
  return `BM-${year}-${num}`;
}

export function generateInvoiceNumber(existingCount = 0) {
  const year = new Date().getFullYear();
  const num = String(existingCount + 1).padStart(4, '0');
  return `INV-${year}-${num}`;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getDaysDiff(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

export function isOverdue(dueDate) {
  return new Date(dueDate) < new Date();
}

export function truncate(str, max = 30) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}
