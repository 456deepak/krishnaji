const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, handleWebhook } = require('../controllers/paymentController');
const authenticateToken = require('../middleware/auth');

// Create order (protected route)
router.post('/create-order', authenticateToken, createOrder);

// Verify payment (protected route)
router.get('/verify/:order_id', authenticateToken, verifyPayment);

// Webhook endpoint (public route)
router.post('/webhook', handleWebhook);

module.exports = router; 