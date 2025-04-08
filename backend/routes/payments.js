const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { Cashfree } = require('cashfree-pg');
const axios = require('axios');
const Transaction = require('../models/Transaction');
// Initialize Cashfree
const cashfree = new Cashfree(
  process.env.CASHFREE_ENV === 'production' ? Cashfree.PRODUCTION : Cashfree.SANDBOX,
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


// Update user balance
router.post('/update-balance', auth, async (req, res) => {
  try {
    const { amount, paymentData } = req.body;
    const userId = req.user.id;
    
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user balance
    user.balance = (user.balance || 0) + parseFloat(amount);
    await user.save();

    console.log(`User ${userId} balance updated to ${user.balance}`);

    // Return success
    res.json({
      success: true,
      message: 'Balance updated successfully',
      data: {
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Error updating balance:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update balance'
    });
  }
});

// Store transaction
router.post('/store-transaction', auth, async (req, res) => {
  try {
    const { amount, orderId, status, ...paymentData } = req.body;
    const userId = req.user.id;

    // Create a new payment record
    const payment = new Payment({
      user: userId,
      orderId: orderId || `ORDER_${Date.now()}`,
      amount: parseFloat(amount || 0),
      status: status || 'pending',
      paymentDetails: {
        ...paymentData
      },
      metadata: paymentData
    });

    await payment.save();
    console.log('Payment transaction stored:', payment);

    res.json({
      success: true,
      message: 'Transaction stored successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error storing transaction:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to store transaction'
    });
  }
});

// Verify payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log('Verifying payment for order:', orderId);

    // Fetch order from Cashfree using axios directly to ensure correct URL is used
    const orderResponse = await axios.get(
      process.env.CASHFREE_ENV === 'production' 
        ? `https://api.cashfree.com/pg/orders/${orderId}` 
        : `https://sandbox.cashfree.com/pg/orders/${orderId}`,
      {
        headers: {
          'x-api-version': '2023-08-01',
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Cashfree order verification response:', orderResponse.data);
    
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      throw new Error('Payment record not found');
    }

    // Map Cashfree status to our allowed enum values
    const cashfreeStatus = (orderResponse.data.order_status || 'pending').toLowerCase();
    let newStatus = 'pending';
    if (cashfreeStatus === 'paid' || cashfreeStatus === 'success') {
      newStatus = 'completed';
    } else if (cashfreeStatus === 'failed' || cashfreeStatus === 'cancelled') {
      newStatus = 'failed';
    }
    
    payment.status = newStatus;
    payment.paymentId = orderResponse.data.payment_id;
    payment.paymentMethod = orderResponse.data.payment_method;
    payment.transactionId = orderResponse.data.transaction_id;
    payment.metadata = orderResponse.data;

    await payment.save();
    console.log('Payment record updated:', payment);

    // If payment is successful, update user balance
    if (newStatus === 'completed') {
      try {
        const user = await User.findById(payment.user);
        if (user) {
          // Check if balance was already updated
          const previousBalance = user.balance || 0;
          user.balance = previousBalance + parseFloat(payment.amount);
          await user.save();
          console.log(`User ${user._id} balance updated from ${previousBalance} to ${user.balance}`);
          
          // Create a transaction record
          const transaction = new Transaction({
            userId: user._id,
            type: 'deposit',
            amount: payment.amount,
            description: `Payment verified for order ${payment.orderId}`,
            status: 'completed'
          });
          await transaction.save();
          console.log(`Transaction record created: ${transaction._id}`);
        } else {
          console.error(`User not found for payment: ${payment._id}`);
        }
      } catch (error) {
        console.error('Error updating user balance:', error);
      }
    }

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
    
    // Find the payment in our database
    const payment = await Payment.findOne({ orderId: order_id });
    
    if (!payment) {
      console.log(`Payment not found for order: ${order_id}`);
      return res.json({ success: true }); // Acknowledge receipt even if not found
    }
    
    console.log(`Found payment record: ${payment._id}, current status: ${payment.status}`);
    
    // Update payment status based on Cashfree status
    let newStatus = 'pending';
    if (order_status === 'PAID' || order_status === 'SUCCESS') {
      newStatus = 'completed';
    } else if (order_status === 'FAILED' || order_status === 'CANCELLED') {
      newStatus = 'failed';
    }
    
    payment.status = newStatus;
    payment.paymentId = payment_id;
    payment.metadata = {
      ...payment.metadata,
      webhook_data: req.body,
      updated_at: new Date().toISOString()
    };
    
    await payment.save();
    console.log(`Payment ${payment_id} for order ${order_id} updated to ${newStatus}`);
    
    // If payment is successful, update user balance
    if (newStatus === 'completed') {
      try {
        const user = await User.findById(payment.user);
        if (user) {
          // Update user balance
          const previousBalance = user.balance || 0;
          user.balance = previousBalance + parseFloat(payment.amount);
          await user.save();
          console.log(`User ${user._id} balance updated from ${previousBalance} to ${user.balance}`);
          
          // Create a transaction record
          const transaction = new Transaction({
            userId: user._id,
            type: 'deposit',
            amount: payment.amount,
            description: `Payment received for order ${payment.orderId}`,
            status: 'completed'
          });
          await transaction.save();
          console.log(`Transaction record created: ${transaction._id}`);
        } else {
          console.error(`User not found for payment: ${payment._id}`);
        }
      } catch (error) {
        console.error('Error updating user balance:', error);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Callback endpoint for payment status
router.get('/callback', async (req, res) => {
  try {
    const { order_id, status } = req.query;
    console.log('Payment callback received:', { order_id, status, query: req.query });
    
    // Find the payment in our database
    const payment = await Payment.findOne({ orderId: order_id });
    
    if (!payment) {
      console.log(`Payment not found for order: ${order_id}`);
      return res.redirect(`/payment/failure?order_id=${order_id}&error=payment_not_found`);
    }
    
    console.log(`Found payment record: ${payment._id}, current status: ${payment.status}`);
    
    // Update payment status based on URL status parameter
    let newStatus = 'pending';
    if (status === 'success') {
      newStatus = 'completed';
    } else if (status === 'failure') {
      newStatus = 'failed';
    }
    
    payment.status = newStatus;
    payment.metadata = {
      ...payment.metadata,
      callback_data: req.query,
      updated_at: new Date().toISOString()
    };
    
    await payment.save();
    console.log(`Payment ${payment._id} for order ${order_id} updated to ${newStatus}`);
    
    // If payment is successful, update user balance
    if (newStatus === 'completed') {
      try {
        const user = await User.findById(payment.user);
        if (user) {
          // Update user balance
          const previousBalance = user.balance || 0;
          user.balance = previousBalance + parseFloat(payment.amount);
          await user.save();
          console.log(`User ${user._id} balance updated from ${previousBalance} to ${user.balance}`);
          
          // Create a transaction record
          const transaction = new Transaction({
            userId: user._id,
            type: 'deposit',
            amount: payment.amount,
            description: `Payment received for order ${payment.orderId}`,
            status: 'completed'
          });
          await transaction.save();
          console.log(`Transaction record created: ${transaction._id}`);
          
          // Redirect to success page
          return res.redirect(`/payment/success?order_id=${order_id}`);
        } else {
          console.error(`User not found for payment: ${payment._id}`);
          return res.redirect(`/payment/failure?order_id=${order_id}&error=user_not_found`);
        }
      } catch (error) {
        console.error('Error updating user balance:', error);
        return res.redirect(`/payment/failure?order_id=${order_id}&error=balance_update_failed`);
      }
    }
    
    // For non-successful payments, redirect to failure page
    return res.redirect(`/payment/failure?order_id=${order_id}&status=${newStatus}`);
  } catch (error) {
    console.error('Callback error:', error);
    return res.redirect(`/payment/failure?error=${encodeURIComponent(error.message)}`);
  }
});

// Get payment history - MUST be before the /:orderId route
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

// Get Payment Details - MUST be after all specific routes
router.get('/:orderId', auth, async (req, res) => {
  try {
    console.log('Fetching payment details for order ID:', req.params.orderId);
    
    const payment = await Payment.findOne({
      orderId: req.params.orderId,
      user: req.user.id
    });

    if (!payment) {
      console.log(`Payment not found for order ID: ${req.params.orderId}`);
      return res.status(404).json({ 
        success: false,
        message: 'Payment not found' 
      });
    }

    console.log(`Found payment: ${payment._id}, status: ${payment.status}`);
    
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