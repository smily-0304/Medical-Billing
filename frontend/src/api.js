const API = '/api/invoices';

export async function fetchInvoices(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API}${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch invoices');
  return res.json();
}

export async function createInvoice(data) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create invoice');
  }
  return res.json();
}

export async function previewCalculation(items, coveragePercent) {
  const res = await fetch(`${API}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, coveragePercent }),
  });
  if (!res.ok) throw new Error('Calculation failed');
  return res.json();
}

export async function updatePayment(id, data) {
  const res = await fetch(`${API}/${id}/payment`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Payment update failed');
  return res.json();
}

export async function fetchReceipt(id) {
  const res = await fetch(`${API}/${id}/receipt`);
  if (!res.ok) throw new Error('Failed to fetch receipt');
  return res.json();
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function paymentStatusClass(status) {
  const map = {
    pending: 'status-pending',
    partial: 'status-partial',
    paid: 'status-paid',
    overdue: 'status-overdue',
  };
  return map[status] || 'status-pending';
}
