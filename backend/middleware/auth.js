const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = function(req, res, next) {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Check if no token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Set user ID correctly
        req.user = {
            id: decoded.userId, // Map userId from token to id in req.user
            role: decoded.role
        };
        
        console.log('Auth middleware - User ID:', req.user.id);
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
}; 