const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { Cashfree } = require('cashfree-pg');

// Initialize Cashfree with the correct environment variable names
const cashfree = new Cashfree(
  process.env.CASHFREE_ENV === 'production' ? Cashfree.PRODUCTION : Cashfree.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
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
      order_amount: amount.toString(),
      order_currency: 'INR',
      customer_details: {
        customer_id: userId,
        customer_name: recipientName,
        customer_email: recipientEmail,
        customer_phone: recipientPhone
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/payment/success?order_id={order_id}`,
        notify_url: 'https://webhook.site/0a3a8d98-a063-4104-9959-20b7cbac9854'
      }
    };

    console.log('Order request:', orderRequest);
    console.log('Cashfree credentials:', {
      appId: "TEST10521959fe208239e07027d11fea95912501" ? 'Set' : 'Not set',
      secretKey: "cfsk_ma_test_4197569adaa2437152606159bc2bbdaa_2331ff1d" ? 'Set' : 'Not set',
      environment: "sandbox"
    });

    // Create order with Cashfree using the correct method
    let orderResponse;
    try {
      // In Cashfree SDK v5, we don't need to pass the API version as the first parameter
      // Just pass the order request directly
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
      orderId: orderResponse.data.order_id,
      paymentSessionId: orderResponse.data.payment_session_id,
      orderStatus: orderResponse.data.order_status,
      orderAmount: orderResponse.data.order_amount,
      orderCurrency: orderResponse.data.order_currency
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ message: error.message || 'Failed to create payment' });
  }
});

// Process payment
router.post('/process', auth, async (req, res) => {
    try {
        const { orderId, paymentId, status } = req.body;

        // Find payment
        const payment = await Payment.findOne({ orderId, paymentId });
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Find user
        const user = await User.findById(payment.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Start a session for transaction
        const session = await Payment.startSession();
        session.startTransaction();

        try {
            // Update payment status
            payment.status = status;
            await payment.save({ session });

            // If payment is completed, update user's balance
            if (status === 'completed') {
                user.balance += payment.amount;
                await user.save({ session });
            }

            // Commit the transaction
            await session.commitTransaction();
            session.endSession();

            res.json({
                message: 'Payment processed successfully',
                payment: {
                    orderId: payment.orderId,
                    paymentId: payment.paymentId,
                    amount: payment.amount,
                    status: payment.status
                },
                user: {
                    balance: user.balance
                }
            });
        } catch (error) {
            // If any error occurs, abort the transaction
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await Payment.find({ user: userId })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
});

// Get Payment Details
router.get('/:orderId', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      orderId: req.params.orderId,
      userId: req.user.userId
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Payment details error:', error);
    res.status(500).json({ message: 'Failed to fetch payment details' });
  }
});

// Create Cashfree order
router.get('/create-order',  async (req, res) => {
  try {
    // const { amount } = req.body;
    // const user = await User.findById(req.user.id);

    // if (!user) {
    //   return res.status(404).json({ message: 'User not found' });
    // }

    // if (!user.paymentDetails) {
    //   return res.status(400).json({ message: 'Payment details not found. Please update your profile.' });
    // }

    // Create order request
    const orderRequest = {
      order_amount: "100",
      order_currency: "INR",
      customer_details: {
        customer_id: "1234567890",
        customer_name: "John Doe",
        customer_email: "john.doe@example.com",
        customer_phone: "1234567890"
      },
      order_note: `Payment from John Doe`
    };  

    // Create order using Cashfree SDK
    const response = await cashfree.PGCreateOrder(orderRequest);
    
    // Create payment record in database
        // const payment = new Payment({
        // userId: user._id,
        // orderId: response.data.order_id,
        // amount,
        // recipientName: user.paymentDetails.recipientName,
        // recipientEmail: user.paymentDetails.recipientEmail,
        // recipientPhone: user.paymentDetails.recipientPhone,
        // status: 'pending',
        // paymentSessionId: response.data.payment_session_id
        // });

        // await payment.save();

    res.json({
      paymentSessionId: response.data.payment_session_id
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order' });
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

    res.json(payment);
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: error.message || 'Failed to verify payment' });
  }
});

module.exports = router; 