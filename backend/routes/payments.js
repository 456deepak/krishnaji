const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { Cashfree } = require('cashfree-pg');

// Initialize Cashfree
const cashfree = new Cashfree(
  Cashfree.SANDBOX,
  process.env.CASHFREE_APP_ID || "TEST10521959fe208239e07027d11fea95912501",
  process.env.CASHFREE_SECRET_KEY || "cfsk_ma_test_4197569adaa2437152606159bc2bbdaa_2331ff1d"
);

// Validation middleware
const validatePayment = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('recipientName').notEmpty().withMessage('Recipient name is required'),
  body('recipientEmail').isEmail().withMessage('Valid recipient email is required'),
  body('recipientPhone').notEmpty().withMessage('Recipient phone is required')
];

// Create payment
router.post('/create', auth, validatePayment, async (req, res) => {
  try {
    console.log('Payment creation request received:', req.body);
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, recipientName, recipientEmail, recipientPhone } = req.body;
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = req.user.id;
    
    console.log('User ID from auth middleware:', userId);
    console.log('Creating order with ID:', orderId);

    // Create order request
    const orderRequest = {
      order_id: orderId,
      order_amount: Number(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: userId,
        customer_name: recipientName,
        customer_email: recipientEmail,
        customer_phone: recipientPhone
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/payment/success?order_id={order_id}`,
        notify_url: `${process.env.BACKEND_URL}/api/payments/webhook`
      }
    };

    console.log('Order request:', orderRequest);

    // Create order with Cashfree using the correct method
    let orderResponse;
    try {
      orderResponse = await cashfree.PGCreateOrder(orderRequest);
      console.log('Cashfree order response:', orderResponse);
    } catch (error) {
      console.error('Error with PGCreateOrder:', error);
      console.error('Error details:', error.response ? error.response.data : 'No response data');
      
      // Check if it's an authentication error
      if (error.response && error.response.status === 401) {
        console.error('Authentication failed. Please check your Cashfree credentials.');
        return res.status(401).json({ 
          message: 'Authentication failed with Cashfree. Please check your credentials.',
          details: error.response.data
        });
      }
      
      throw new Error(`Failed to create order with Cashfree: ${error.message}`);
    }

    // Handle response
    if (!orderResponse || !orderResponse.data || !orderResponse.data.order_id) {
      console.error('Invalid order response:', orderResponse);
      throw new Error('Invalid response from Cashfree');
    }

    // Create payment record
    const payment = new Payment({
      user: userId,
      orderId: orderResponse.data.order_id,
      amount,
      paymentDetails: {
        recipientName,
        recipientEmail,
        recipientPhone
      },
      status: 'pending'
    });

    await payment.save();
    console.log('Payment record created:', payment);

    // Return both order ID and payment session ID
    res.json({
      success: true,
      data: {
        orderId: orderResponse.data.order_id,
        payment_session_id: orderResponse.data.payment_session_id,
        orderStatus: orderResponse.data.order_status,
        orderAmount: orderResponse.data.order_amount,
        orderCurrency: orderResponse.data.order_currency
      }
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to create payment' 
    });
  }
});

// Create order and get payment session ID
router.post('/create-order', auth, async (req, res) => {
  try {
    const { order_amount, order_currency, customer_details } = req.body;
    const userId = req.user.id;
    
    // Generate unique order ID
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create order request
    const orderRequest = {
      order_id: orderId,
      order_amount: Number(order_amount),
      order_currency: order_currency || 'INR',
      customer_details: customer_details || {
        customer_id: userId,
        customer_name: "John Doe",
        customer_email: "john.doe@example.com",
        customer_phone: "9999999999"
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/payment/success?order_id={order_id}`,
        notify_url: `${process.env.BACKEND_URL}/api/payments/webhook`
      }
    };

    console.log('Creating order with Cashfree:', orderRequest);

    // Create order with Cashfree
    const orderResponse = await cashfree.PGCreateOrder(orderRequest);
    console.log('Cashfree order response:', orderResponse);

    // Return the payment session ID to the frontend
    res.json({
      success: true,
      data: orderResponse.data
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error creating order' 
    });
  }
});

// Verify payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log('Verifying payment for order:', orderId);

    // Fetch order from Cashfree
    const orderResponse = await cashfree.PGFetchOrder(orderId);
    console.log('Cashfree order verification response:', orderResponse);
    
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      throw new Error('Payment record not found');
    }

    payment.status = (orderResponse.data.order_status || 'pending').toLowerCase();
    payment.paymentId = orderResponse.data.payment_id;
    payment.paymentMethod = orderResponse.data.payment_method;
    payment.transactionId = orderResponse.data.transaction_id;
    payment.metadata = orderResponse.data;

    await payment.save();
    console.log('Payment record updated:', payment);

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to verify payment' 
    });
  }
});

// Webhook handler
router.post('/webhook', async (req, res) => {
  try {
    const { order_id, order_status, payment_id } = req.body;
    console.log('Webhook received:', req.body);
    
    // Here you would update your database with the payment status
    // For now, just log it
    console.log(`Payment ${payment_id} for order ${order_id} is now ${order_status}`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await Payment.find({ user: userId })
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch payment history' 
    });
  }
});

// Get Payment Details
router.get('/:orderId', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      orderId: req.params.orderId,
      user: req.user.id
    });

    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: 'Payment not found' 
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Payment details error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch payment details' 
    });
  }
});

module.exports = router; 