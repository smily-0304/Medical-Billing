import { useState, useEffect, useCallback } from 'react';
import {
  fetchInvoices,
  createInvoice,
  previewCalculation,
  updatePayment,
  fetchReceipt,
  formatCurrency,
  formatDate,
  paymentStatusClass,
} from './api';

const emptyItem = { description: '', quantity: 1, unitPrice: 0 };

function InvoiceForm({ onCreated }) {
  const [form, setForm] = useState({
    patientName: '',
    patientId: '',
    patientPhone: '',
    patientEmail: '',
    diagnosis: '',
    insuranceProvider: '',
    policyNumber: '',
    coveragePercent: 0,
    notes: '',
  });
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validItems = items.filter((i) => i.description && i.unitPrice > 0);

  const runPreview = useCallback(async () => {
    if (validItems.length === 0) {
      setPreview(null);
      return;
    }
    try {
      const result = await previewCalculation(validItems, Number(form.coveragePercent) || 0);
      setPreview(result);
    } catch {
      setPreview(null);
    }
  }, [validItems, form.coveragePercent]);

  useEffect(() => {
    runPreview();
  }, [runPreview]);

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: field === 'description' ? value : Number(value) } : item
      )
    );
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const invoice = await createInvoice({
        patientName: form.patientName,
        patientId: form.patientId,
        patientPhone: form.patientPhone,
        patientEmail: form.patientEmail,
        diagnosis: form.diagnosis,
        notes: form.notes,
        items: validItems,
        insurance: {
          provider: form.insuranceProvider,
          policyNumber: form.policyNumber,
          coveragePercent: Number(form.coveragePercent) || 0,
        },
      });
      onCreated(invoice);
      setForm({
        patientName: '',
        patientId: '',
        patientPhone: '',
        patientEmail: '',
        diagnosis: '',
        insuranceProvider: '',
        policyNumber: '',
        coveragePercent: 0,
        notes: '',
      });
      setItems([{ ...emptyItem }]);
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="invoice-form" onSubmit={handleSubmit}>
      <h2>Generate Invoice</h2>
      {error && <p className="error">{error}</p>}

      <div className="form-grid">
        <label>
          Patient Name *
          <input required value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
        </label>
        <label>
          Patient ID *
          <input required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} />
        </label>
        <label>
          Phone
          <input value={form.patientPhone} onChange={(e) => setForm({ ...form, patientPhone: e.target.value })} />
        </label>
        <label>
          Email
          <input type="email" value={form.patientEmail} onChange={(e) => setForm({ ...form, patientEmail: e.target.value })} />
        </label>
        <label className="full">
          Diagnosis
          <input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
        </label>
      </div>

      <h3>Line Items</h3>
      {items.map((item, index) => (
        <div key={index} className="item-row">
          <input
            placeholder="Description"
            value={item.description}
            onChange={(e) => updateItem(index, 'description', e.target.value)}
          />
          <input
            type="number"
            min="1"
            placeholder="Qty"
            value={item.quantity}
            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Unit Price"
            value={item.unitPrice || ''}
            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
          />
          {items.length > 1 && (
            <button type="button" className="btn-remove" onClick={() => removeItem(index)}>×</button>
          )}
        </div>
      ))}
      <button type="button" className="btn-add" onClick={addItem}>+ Add Item</button>

      <h3>Insurance Details</h3>
      <div className="form-grid">
        <label>
          Provider
          <input value={form.insuranceProvider} onChange={(e) => setForm({ ...form, insuranceProvider: e.target.value })} />
        </label>
        <label>
          Policy Number
          <input value={form.policyNumber} onChange={(e) => setForm({ ...form, policyNumber: e.target.value })} />
        </label>
        <label>
          Coverage %
          <input
            type="number"
            min="0"
            max="100"
            value={form.coveragePercent}
            onChange={(e) => setForm({ ...form, coveragePercent: e.target.value })}
          />
        </label>
      </div>

      {preview && (
        <div className="preview-box">
          <h3>GST Calculation Preview</h3>
          <div className="preview-row"><span>Subtotal</span><span>{formatCurrency(preview.subtotal)}</span></div>
          <div className="preview-row"><span>GST ({preview.gstRate}%)</span><span>{formatCurrency(preview.gstAmount)}</span></div>
          <div className="preview-row"><span>Total</span><span>{formatCurrency(preview.totalAmount)}</span></div>
          <div className="preview-row"><span>Insurance Coverage</span><span>- {formatCurrency(preview.insurance.coveredAmount)}</span></div>
          <div className="preview-row total"><span>Patient Payable</span><span>{formatCurrency(preview.patientPayable)}</span></div>
        </div>
      )}

      <button type="submit" className="btn-primary" disabled={loading || validItems.length === 0}>
        {loading ? 'Generating...' : 'Generate Invoice'}
      </button>
    </form>
  );
}

function ReceiptModal({ invoiceId, onClose }) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceipt(invoiceId)
      .then(setReceipt)
      .finally(() => setLoading(false));
  }, [invoiceId]);

  const handlePrint = () => window.print();

  if (loading) return <div className="modal"><p>Loading receipt...</p></div>;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt" id="receipt-content">
          <div className="receipt-header">
            <h2>{receipt.hospital.name}</h2>
            <p>{receipt.hospital.address}</p>
            <p>GSTIN: {receipt.hospital.gstin} · {receipt.hospital.phone}</p>
          </div>
          <hr />
          <div className="receipt-meta">
            <div>
              <strong>Receipt:</strong> {receipt.receiptNumber}<br />
              <strong>Invoice:</strong> {receipt.invoiceNumber}<br />
              <strong>Date:</strong> {formatDate(receipt.issuedAt)}
            </div>
            <div>
              <strong>Patient:</strong> {receipt.patient.name}<br />
              <strong>ID:</strong> {receipt.patient.id}<br />
              <strong>Phone:</strong> {receipt.patient.phone || '—'}
            </div>
          </div>
          <table className="receipt-table">
            <thead>
              <tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {receipt.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="receipt-totals">
            <div><span>Subtotal</span><span>{formatCurrency(receipt.subtotal)}</span></div>
            <div><span>GST ({receipt.gstRate}%)</span><span>{formatCurrency(receipt.gstAmount)}</span></div>
            <div><span>Total</span><span>{formatCurrency(receipt.totalAmount)}</span></div>
            {receipt.insurance.coveragePercent > 0 && (
              <>
                <div><span>Insurance ({receipt.insurance.provider})</span><span>- {formatCurrency(receipt.insurance.coveredAmount)}</span></div>
                <div><span>Policy</span><span>{receipt.insurance.policyNumber}</span></div>
              </>
            )}
            <div className="highlight"><span>Patient Payable</span><span>{formatCurrency(receipt.patientPayable)}</span></div>
            <div><span>Paid</span><span>{formatCurrency(receipt.paidAmount)}</span></div>
            <div><span>Balance</span><span>{formatCurrency(receipt.balance)}</span></div>
            <div><span>Status</span><span className={paymentStatusClass(receipt.paymentStatus)}>{receipt.paymentStatus}</span></div>
          </div>
        </div>
        <div className="modal-actions">
          <button onClick={handlePrint}>Print Receipt</button>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ invoice, onClose, onUpdated }) {
  const [paidAmount, setPaidAmount] = useState(invoice.paidAmount);
  const [paymentMethod, setPaymentMethod] = useState(invoice.paymentMethod || 'Cash');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await updatePayment(invoice._id, { paidAmount: Number(paidAmount), paymentMethod });
      onUpdated(updated);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Update Payment</h2>
        <p>Invoice: <strong>{invoice.invoiceNumber}</strong> · Payable: {formatCurrency(invoice.patientPayable)}</p>
        <form onSubmit={handleSubmit}>
          <label>
            Amount Paid
            <input type="number" min="0" step="0.01" max={invoice.patientPayable} value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} required />
          </label>
          <label>
            Payment Method
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Net Banking</option>
            </select>
          </label>
          <div className="modal-actions">
            <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Payment'}</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [receiptId, setReceiptId] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.paymentStatus = filter;
      if (search.trim()) params.search = search.trim();
      const data = await fetchInvoices(params);
      setInvoices(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleCreated = (invoice) => {
    setInvoices((prev) => [invoice, ...prev]);
    setActiveTab('list');
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>🏥 Medical Billing System</h1>
          <p className="subtitle">Invoices, insurance, GST & receipts</p>
        </div>
      </header>

      <nav className="tabs">
        <button className={activeTab === 'list' ? 'active' : ''} onClick={() => setActiveTab('list')}>Invoices</button>
        <button className={activeTab === 'create' ? 'active' : ''} onClick={() => setActiveTab('create')}>New Invoice</button>
      </nav>

      {activeTab === 'create' ? (
        <InvoiceForm onCreated={handleCreated} />
      ) : (
        <>
          <div className="toolbar">
            <input
              placeholder="Search invoice, patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {error && <p className="error banner">{error}</p>}

          {loading ? (
            <p className="loading">Loading invoices...</p>
          ) : (
            <div className="invoice-grid">
              {invoices.length === 0 ? (
                <p className="empty">No invoices found</p>
              ) : (
                invoices.map((inv) => (
                  <div key={inv._id} className="invoice-card">
                    <div className="card-header">
                      <strong>{inv.invoiceNumber}</strong>
                      <span className={`status ${paymentStatusClass(inv.paymentStatus)}`}>{inv.paymentStatus}</span>
                    </div>
                    <p className="patient">{inv.patientName} · {inv.patientId}</p>
                    <p className="diagnosis">{inv.diagnosis || '—'}</p>
                    <div className="amounts">
                      <div><span>Total</span><span>{formatCurrency(inv.totalAmount)}</span></div>
                      <div><span>GST ({inv.gstRate}%)</span><span>{formatCurrency(inv.gstAmount)}</span></div>
                      {inv.insurance.coveragePercent > 0 && (
                        <div><span>Insurance ({inv.insurance.coveragePercent}%)</span><span>{inv.insurance.provider}</span></div>
                      )}
                      <div className="highlight"><span>Payable</span><span>{formatCurrency(inv.patientPayable)}</span></div>
                      <div><span>Paid</span><span>{formatCurrency(inv.paidAmount)}</span></div>
                    </div>
                    <div className="card-actions">
                      <button onClick={() => setReceiptId(inv._id)}>Receipt</button>
                      <button className="btn-secondary" onClick={() => setPaymentInvoice(inv)}>Payment</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {receiptId && <ReceiptModal invoiceId={receiptId} onClose={() => setReceiptId(null)} />}
      {paymentInvoice && (
        <PaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onUpdated={(updated) => setInvoices((prev) => prev.map((i) => (i._id === updated._id ? updated : i)))}
        />
      )}
    </div>
  );
}
