function calculateTotals(items, gstRate, insuranceCoveragePercent = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const gstAmount = Math.round((subtotal * gstRate) / 100 * 100) / 100;
  const totalAmount = Math.round((subtotal + gstAmount) * 100) / 100;
  const coveredAmount =
    Math.round((totalAmount * insuranceCoveragePercent) / 100 * 100) / 100;
  const patientPayable = Math.round((totalAmount - coveredAmount) * 100) / 100;

  const processedItems = items.map((item) => ({
    ...item,
    amount: Math.round(item.quantity * item.unitPrice * 100) / 100,
  }));

  return {
    items: processedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    gstAmount,
    totalAmount,
    insurance: {
      coveredAmount,
    },
    patientPayable,
  };
}

function generateInvoiceNumber() {
  const date = new Date();
  const prefix = 'INV';
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${y}${m}-${random}`;
}

module.exports = { calculateTotals, generateInvoiceNumber };
