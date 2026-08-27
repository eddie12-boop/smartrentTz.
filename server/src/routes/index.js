const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const propertyRoutes = require('./propertyRoutes');
const applicationRoutes = require('./applicationRoutes');
const leaseRoutes = require('./leaseRoutes');
const paymentRoutes = require('./paymentRoutes');
const maintenanceRoutes = require('./maintenanceRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const aiRoutes = require('./aiRoutes');

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy' });
});

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/applications', applicationRoutes);
router.use('/leases', leaseRoutes);
router.use('/payments', paymentRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
