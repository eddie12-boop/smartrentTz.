const express = require('express');
const { getProperties, getProperty, createProperty } = require('../controllers/propertyController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', getProperties);
router.get('/:id', getProperty);

// Protected routes
router.use(authenticate);
router.post('/', authorize('LANDLORD', 'AGENT', 'ADMIN'), upload.array('images', 10), createProperty);

module.exports = router;
