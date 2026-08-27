const express = require('express');
const router = express.Router();
const { createLease, getMyLeases } = require('../controllers/leaseController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);

router.post('/', authorize('LANDLORD', 'ADMIN'), createLease);
router.get('/my', getMyLeases);

module.exports = router;
