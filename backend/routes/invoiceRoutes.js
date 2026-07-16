const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updatePayment,
  getReceipt,
  previewCalculation,
} = require('../controllers/invoiceController');

router.get('/', getInvoices);
router.post('/preview', previewCalculation);
router.get('/:id/receipt', getReceipt);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.patch('/:id/payment', updatePayment);

module.exports = router;
