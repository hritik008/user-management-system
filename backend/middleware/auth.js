const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from cookie
    if (req.cookies.token) {
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or has expired'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user can modify target user (parent-child relationship)
exports.canModifyUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.body.userId;
    
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID is required'
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }

    // Owner and admin can modify anyone in their hierarchy
    if (req.user.role === 'owner' || req.user.role === 'admin') {
      // Check if target user is in downline
      const downline = await req.user.getDownline();
      const isInDownline = downline.some(user => user._id.toString() === targetUserId);
      
      if (!isInDownline && req.user._id.toString() !== targetUserId) {
        return res.status(403).json({
          success: false,
          message: 'You can only modify users in your downline'
        });
      }
    } else {
      // Regular users can only modify their direct children
      if (targetUser.parent.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only modify your direct children'
        });
      }
    }

    req.targetUser = targetUser;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authorization check'
    });
  }
};
