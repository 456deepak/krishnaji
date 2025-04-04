const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

// Admin Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('Admin signup attempt:', { email });

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Create new admin - password will be hashed by the pre-save middleware
    const admin = new Admin({
      name,
      email,
      password,
      role: 'admin'
    });

    await admin.save();
    console.log('Admin created successfully');

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'Admin created successfully',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Admin login attempt:', { email });

    // Find admin
    const admin = await Admin.findOne({ email });
    console.log('Admin found:', admin ? 'yes' : 'no');

    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password - try both hashed and plain text
    let isMatch = false;
    
    // First try comparing with hashed password
    if (admin.password.startsWith('$2a$')) {
      isMatch = await bcrypt.compare(password, admin.password);
      console.log('Password match (hashed):', isMatch);
    }
    
    // If not hashed, try direct comparison
    if (!isMatch) {
      isMatch = password === admin.password;
      console.log('Password match (plain):', isMatch);
      
      // If matched with plain text, hash the password and update
      if (isMatch) {
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(password, salt);
        await admin.save();
        console.log('Password hashed and updated');
      }
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (protected route)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all payments (protected route)
router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    // Ensure we have valid data structure even if userId is null
    const formattedPayments = payments.map(payment => ({
      _id: payment._id,
      amount: payment.amount,
      status: payment.status,
      createdAt: payment.createdAt,
      userId: payment.userId ? {
        _id: payment.userId._id,
        name: payment.userId.name || 'Unknown User',
        email: payment.userId.email || 'No email'
      } : null
    }));

    res.json(formattedPayments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all transactions (protected route)
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get admin dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await User.countDocuments();
    const totalPayments = await Payment.countDocuments();
    const totalTransactions = await Transaction.countDocuments();

    // Calculate total revenue from completed payments
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalUsers,
        totalPayments,
        totalTransactions,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentTransactions: recentTransactions.map(transaction => ({
        _id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt,
        user: transaction.userId ? {
          name: transaction.userId.name,
          email: transaction.userId.email
        } : null
      }))
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 