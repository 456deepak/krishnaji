const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const { Cashfree } = require('cashfree-pg');
// Load environment variables
dotenv.config();
const cashfree = new Cashfree(
  Cashfree.SANDBOX,
  "TEST10521959fe208239e07027d11fea95912501",
  "cfsk_ma_test_4197569adaa2437152606159bc2bbdaa_2331ff1d",
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
app.get("/api/payments/create-order", async (req, res) => {
  try {
    const result = await axios.post(
      'https://sandbox.cashfree.com/pg/orders',
      {
        orderAmount: "100",
        orderCurrency: "INR",
        customerDetails: {
          customerId: "12345",
          customerEmail: "test@example.com",
          customerPhone: "9999999999"
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': 'TEST10521959fe208239e07027d11fea95912501',
          'x-client-secret': 'cfsk_ma_test_4197569adaa2437152606159bc2bbdaa_2331ff1d'
        }
      }
    );
    console.log('Order creation response:', result.data);
    res.status(200).json(result.data);
  } catch (error) {
    console.error('Cashfree Error:', error.message);
    res.status(500).json({ error: 'Payment API failed' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 