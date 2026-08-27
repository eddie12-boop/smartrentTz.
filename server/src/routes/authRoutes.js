const express = require('express');
const { register, login, googleAuth, getMe, verifyNida } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', authenticate, getMe);
router.post('/verify-nida', authenticate, verifyNida);

module.exports = router;
