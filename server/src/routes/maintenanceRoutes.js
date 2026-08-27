const express = require('express');
const router = express.Router();
const { createMaintenanceRequest, getMaintenanceRequests, updateMaintenanceStatus } = require('../controllers/maintenanceController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);

router.post('/', authorize('TENANT', 'LANDLORD', 'ADMIN'), createMaintenanceRequest);
router.get('/', getMaintenanceRequests);
router.patch('/:id', authorize('LANDLORD', 'ADMIN', 'AGENT'), updateMaintenanceStatus);
router.patch('/:id/status', authorize('LANDLORD', 'ADMIN', 'AGENT'), updateMaintenanceStatus);

module.exports = router;
