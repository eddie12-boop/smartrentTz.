const express = require('express');
const router = express.Router();
const { handleAIChat } = require('../controllers/aiController');

// Public or Authenticated AI Assistant Chat Endpoint
router.post('/chat', handleAIChat);

module.exports = router;
