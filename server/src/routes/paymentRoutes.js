const express = require('express');
const router = express.Router();
const {
  generateGePGControlNumber,
  payWithControlNumber,
  getReceipt,
  recordPayment,
  getMyPayments
} = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Public or Tenant Receipt verification
router.get('/receipt/:identifier', getReceipt);

// Pay via Control number (simulated gateway / tenant action)
router.post('/pay-control-number', payWithControlNumber);

router.use(authenticate);

// Generate GePG Control Number
router.post('/generate-control-number', generateGePGControlNumber);

// Standard endpoints
router.post('/', authorize('TENANT', 'LANDLORD', 'ADMIN'), recordPayment);
router.get('/my', getMyPayments);

module.exports = router;
