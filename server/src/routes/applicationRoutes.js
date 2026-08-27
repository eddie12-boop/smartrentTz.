const express = require('express');
const router = express.Router();
const { createApplication, getMyApplications, getApplicationsForLandlord, updateApplicationStatus } = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);

router.post('/', authorize('TENANT'), createApplication);
router.get('/my', authorize('TENANT'), getMyApplications);
router.get('/landlord', authorize('LANDLORD', 'ADMIN'), getApplicationsForLandlord);
router.patch('/:id/status', authorize('LANDLORD', 'ADMIN'), updateApplicationStatus);

module.exports = router;
