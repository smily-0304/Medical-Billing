const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
});

const insuranceSchema = new mongoose.Schema({
  provider: { type: String, default: '' },
  policyNumber: { type: String, default: '' },
  coveragePercent: { type: Number, default: 0, min: 0, max: 100 },
  coveredAmount: { type: Number, default: 0, min: 0 },
  claimStatus: {
    type: String,
    enum: ['not_applicable', 'pending', 'approved', 'rejected'],
    default: 'not_applicable',
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    patientName: { type: String, required: true },
    patientId: { type: String, required: true },
    patientPhone: { type: String, default: '' },
    patientEmail: { type: String, default: '' },
    diagnosis: { type: String, default: '' },
    items: [lineItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    gstRate: { type: Number, default: 18, min: 0 },
    gstAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    insurance: insuranceSchema,
    patientPayable: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue'],
      default: 'pending',
    },
    paidAmount: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, default: '' },
    paymentDate: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
