const express = require('express');
const {
  register,
  login,
  googleAuth,
  getMe,
  verifyNida,
  getAllUsers,
  toggleUserStatus
} = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', authenticate, getMe);
router.post('/verify-nida', authenticate, verifyNida);

// Admin User Management Routes
router.get('/users', authenticate, authorize('ADMIN'), getAllUsers);
router.patch('/users/:id/status', authenticate, authorize('ADMIN'), toggleUserStatus);

module.exports = router;
