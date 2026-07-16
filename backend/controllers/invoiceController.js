const Invoice = require('../models/Invoice');
const { calculateTotals, generateInvoiceNumber } = require('../utils/billing');

const GST_RATE = parseFloat(process.env.GST_RATE) || 18;

exports.getInvoices = async (req, res) => {
  try {
    const { paymentStatus, search } = req.query;
    const filter = {};

    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
      ];
    }

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const {
      patientName,
      patientId,
      patientPhone,
      patientEmail,
      diagnosis,
      items,
      insurance,
      notes,
    } = req.body;

    if (!patientName || !patientId || !items?.length) {
      return res.status(400).json({ message: 'Patient details and at least one item are required' });
    }

    const coveragePercent = insurance?.coveragePercent || 0;
    const totals = calculateTotals(items, GST_RATE, coveragePercent);

    const invoice = await Invoice.create({
      invoiceNumber: generateInvoiceNumber(),
      patientName,
      patientId,
      patientPhone: patientPhone || '',
      patientEmail: patientEmail || '',
      diagnosis: diagnosis || '',
      items: totals.items,
      subtotal: totals.subtotal,
      gstRate: GST_RATE,
      gstAmount: totals.gstAmount,
      totalAmount: totals.totalAmount,
      insurance: {
        provider: insurance?.provider || '',
        policyNumber: insurance?.policyNumber || '',
        coveragePercent,
        coveredAmount: totals.insurance.coveredAmount,
        claimStatus: coveragePercent > 0 ? 'pending' : 'not_applicable',
      },
      patientPayable: totals.patientPayable,
      paymentStatus: 'pending',
      paidAmount: 0,
      notes: notes || '',
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { paidAmount, paymentMethod, paymentStatus } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (paidAmount !== undefined) invoice.paidAmount = paidAmount;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;

    if (paymentStatus) {
      invoice.paymentStatus = paymentStatus;
    } else if (paidAmount !== undefined) {
      if (paidAmount >= invoice.patientPayable) {
        invoice.paymentStatus = 'paid';
        invoice.paymentDate = new Date();
      } else if (paidAmount > 0) {
        invoice.paymentStatus = 'partial';
      } else {
        invoice.paymentStatus = 'pending';
      }
    }

    await invoice.save();
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getReceipt = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const receipt = {
      receiptNumber: `RCP-${invoice.invoiceNumber}`,
      issuedAt: invoice.paymentDate || invoice.updatedAt,
      hospital: {
        name: 'City General Hospital',
        address: '123 Healthcare Avenue, New Delhi - 110001',
        gstin: '07AABCU9603R1ZM',
        phone: '+91 11 2345 6789',
      },
      patient: {
        name: invoice.patientName,
        id: invoice.patientId,
        phone: invoice.patientPhone,
      },
      invoiceNumber: invoice.invoiceNumber,
      items: invoice.items,
      subtotal: invoice.subtotal,
      gstRate: invoice.gstRate,
      gstAmount: invoice.gstAmount,
      totalAmount: invoice.totalAmount,
      insurance: invoice.insurance,
      patientPayable: invoice.patientPayable,
      paidAmount: invoice.paidAmount,
      balance: Math.max(0, invoice.patientPayable - invoice.paidAmount),
      paymentStatus: invoice.paymentStatus,
      paymentMethod: invoice.paymentMethod,
    };

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.previewCalculation = async (req, res) => {
  try {
    const { items, coveragePercent = 0 } = req.body;
    if (!items?.length) {
      return res.status(400).json({ message: 'Items are required' });
    }
    const totals = calculateTotals(items, GST_RATE, coveragePercent);
    res.json({ gstRate: GST_RATE, ...totals });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
