const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const { Cashfree } = require('cashfree-pg');
const Payment = require('./models/Payment');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
// Load environment variables
dotenv.config();
const cashfree = new Cashfree(
  process.env.CASHFREE_ENV === 'production' ? Cashfree.PRODUCTION : Cashfree.SANDBOX,
  process.env.CASHFREE_APP_ID || "TEST10521959fe208239e07027d11fea95912501",
  process.env.CASHFREE_SECRET_KEY || "cfsk_ma_test_4197569adaa2437152606159bc2bbdaa_2331ff1d"
);

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));


// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/admin', require('./routes/admin'));
app.use("/api/cashfree", async (req, res) => {
  try {
    // Check for authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      userId = decoded.userId;
      console.log('Authenticated user ID:', userId);
      
      // Verify that userId is valid
      if (!userId) {
        console.error('No user ID found in token');
        return res.status(401).json({ error: 'Invalid user ID in token' });
      }
      
      // Verify user exists in database
      const user = await User.findById(userId);
      if (!user) {
        console.error(`User not found for ID: ${userId}`);
        return res.status(401).json({ error: 'User not found' });
      }
      console.log('User verified:', user._id);
      
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { 
      order_amount,
      order_currency,
      customer_name,
      customer_email,
      customer_phone 
    } = req.body;
    
    // Validate required fields
    if (!order_amount || !order_currency || !customer_name || !customer_email || !customer_phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const orderId = "ORDER_" + Date.now();
    
    const orderData = {
      order_id: orderId,
      order_amount: Number(order_amount),
      order_currency: order_currency,
      customer_details: {
        customer_id: "CUST_" + Date.now(),
        customer_name: customer_name,
        customer_email: customer_email,
        customer_phone: customer_phone
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/payment/callback?status=success&order_id=${orderId}`,
        notify_url: `${process.env.BACKEND_URL}/api/payments/webhook`
      }
    };
    
    console.log('Creating Cashfree order:', orderData);
    
    const response = await axios.post(
      process.env.CASHFREE_ENV === 'production' 
        ? "https://api.cashfree.com/pg/orders" 
        : "https://sandbox.cashfree.com/pg/orders", 
      orderData, 
      {
        headers: {
          'x-api-version': '2025-01-01',
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Cashfree response:', response.data);

    // Store order details for later reference
    try {
      console.log('Creating payment record with user ID:', userId);
      
      // Create a pending payment record
      const payment = new Payment({
        user: userId,
        orderId: orderId,
        amount: orderData.order_amount,
        status: 'pending',
        paymentDetails: {
          recipientName: customer_name,
          recipientEmail: customer_email,
          recipientPhone: customer_phone
        },
        metadata: {
          ...orderData,
          cashfree_response: response.data
        }
      });
      
      console.log('Payment object before save:', payment);
      const savedPayment = await payment.save();
      console.log('Pending payment record created:', savedPayment);
    } catch (error) {
      console.error('Error creating pending payment record:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return res.status(500).json({ 
        error: 'Failed to create payment record',
        details: error.message
      });
    }

    res.status(200).send(response.data);
  } catch (error) {
    console.error('Error creating Cashfree order:', error);
    res.status(500).json({ 
      error: error.response?.data?.message || error.message || "Failed to create order" 
    });
  }
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 