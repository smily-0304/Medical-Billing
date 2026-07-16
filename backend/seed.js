require('dotenv').config();
const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');

const sampleInvoices = [
  {
    invoiceNumber: 'INV-2507-1001',
    patientName: 'Rahul Sharma',
    patientId: 'PAT-001',
    patientPhone: '9876543210',
    patientEmail: 'rahul@email.com',
    diagnosis: 'General Checkup',
    items: [
      { description: 'Consultation Fee', quantity: 1, unitPrice: 800, amount: 800 },
      { description: 'Blood Test Panel', quantity: 1, unitPrice: 1200, amount: 1200 },
    ],
    subtotal: 2000,
    gstRate: 18,
    gstAmount: 360,
    totalAmount: 2360,
    insurance: {
      provider: 'Star Health',
      policyNumber: 'SH-2024-88991',
      coveragePercent: 80,
      coveredAmount: 1888,
      claimStatus: 'approved',
    },
    patientPayable: 472,
    paymentStatus: 'paid',
    paidAmount: 472,
    paymentMethod: 'UPI',
    paymentDate: new Date(),
  },
  {
    invoiceNumber: 'INV-2507-1002',
    patientName: 'Priya Patel',
    patientId: 'PAT-002',
    patientPhone: '9123456780',
    diagnosis: 'MRI Scan',
    items: [
      { description: 'MRI Brain Scan', quantity: 1, unitPrice: 8500, amount: 8500 },
      { description: 'Radiologist Report', quantity: 1, unitPrice: 1500, amount: 1500 },
    ],
    subtotal: 10000,
    gstRate: 18,
    gstAmount: 1800,
    totalAmount: 11800,
    insurance: {
      provider: 'ICICI Lombard',
      policyNumber: 'IL-778234',
      coveragePercent: 70,
      coveredAmount: 8260,
      claimStatus: 'pending',
    },
    patientPayable: 3540,
    paymentStatus: 'partial',
    paidAmount: 2000,
    paymentMethod: 'Card',
  },
  {
    invoiceNumber: 'INV-2507-1003',
    patientName: 'Amit Kumar',
    patientId: 'PAT-003',
    patientPhone: '9988776655',
    diagnosis: 'Dental Procedure',
    items: [
      { description: 'Root Canal Treatment', quantity: 1, unitPrice: 6000, amount: 6000 },
      { description: 'Crown Fitting', quantity: 1, unitPrice: 4500, amount: 4500 },
    ],
    subtotal: 10500,
    gstRate: 18,
    gstAmount: 1890,
    totalAmount: 12390,
    insurance: {
      provider: '',
      policyNumber: '',
      coveragePercent: 0,
      coveredAmount: 0,
      claimStatus: 'not_applicable',
    },
    patientPayable: 12390,
    paymentStatus: 'pending',
    paidAmount: 0,
  },
];

async function seed() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medical_billing'
    );
    await Invoice.deleteMany({});
    await Invoice.insertMany(sampleInvoices);
    console.log('Sample invoices seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
}

seed();
