const express = require('express');
const router = express.Router();
const { getExecutiveOverview } = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);
router.get('/executive-overview', authorize('ADMIN', 'LANDLORD', 'AGENT'), getExecutiveOverview);

module.exports = router;
