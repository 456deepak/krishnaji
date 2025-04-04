const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create transaction (deposit/withdraw)
router.post('/', auth, async (req, res) => {
    const session = await Transaction.startSession();
    session.startTransaction();

    try {
        const { type, amount, description } = req.body;
        const userId = req.user.userId;

        // Find user
        const user = await User.findById(userId).session(session);
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'User not found' });
        }

        // For withdrawals, check if user has sufficient balance
        if (type === 'withdraw' && user.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Create transaction
        const transaction = new Transaction({
            userId,
            type,
            amount,
            description,
            status: 'completed'
        });

        // Update user balance
        if (type === 'deposit') {
            user.balance += amount;
        } else if (type === 'withdraw') {
            user.balance -= amount;
        }

        // Save both transaction and user in the same session
        await transaction.save({ session });
        await user.save({ session });

        // Commit the transaction
        await session.commitTransaction();

        res.json({
            message: `${type} successful`,
            transaction,
            balance: user.balance
        });
    } catch (error) {
        // If there's an error, abort the transaction
        await session.abortTransaction();
        console.error('Transaction error:', error);
        res.status(500).json({ message: 'Transaction failed', error: error.message });
    } finally {
        // End the session
        session.endSession();
    }
});

// Get transaction history
router.get('/history', auth, async (req, res) => {
    try {
        const { type, fromDate, toDate, minAmount, maxAmount, search, status } = req.query;
        const userId = req.user.userId;

        let query = { userId };

        // Handle type filter
        if (type && type !== 'all') {
            query.type = type;
        }

        // Handle status filter
        if (status && status !== 'all') {
            query.status = status;
        }

        // Handle date range
        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) query.createdAt.$lte = new Date(toDate);
        }

        // Handle amount range
        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount) query.amount.$gte = parseFloat(minAmount);
            if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
        }

        // Handle search
        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const transactions = await Transaction.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        // Format the response to include user information
        const formattedTransactions = transactions.map(transaction => ({
            ...transaction.toObject(),
            userName: transaction.userId?.name || 'Unknown User',
            userEmail: transaction.userId?.email || 'No email'
        }));

        res.json(formattedTransactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Failed to fetch transactions' });
    }
});

// Get transaction summary (balance)
router.get('/summary', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            balance: user.balance
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ message: 'Failed to fetch summary' });
    }
});

module.exports = router; 