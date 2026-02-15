const User = require('../models/User');
const jwt = require('jsonwebtoken');
const svgCaptcha = require('svg-captcha');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      level: user.level,
      balance: user.balance,
      parent: user.parent
    }
  });
};

// @desc    Generate CAPTCHA
// @route   GET /api/auth/captcha
// @access  Public
exports.getCaptcha = async (req, res) => {
  try {
    const captcha = svgCaptcha.create({
      size: 6,
      noise: 2,
      color: true,
      background: '#f0f0f0'
    });

    // Store captcha text in session with expiry
    req.session.captcha = {
      text: captcha.text.toLowerCase(),
      expires: Date.now() + parseInt(process.env.CAPTCHA_EXPIRE)
    };

    res.json({
      success: true,
      captcha: captcha.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating CAPTCHA'
    });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (for first owner) / Protected (for hierarchy)
exports.register = async (req, res) => {
  try {
    const { username, email, password, role, commissionRate } = req.body;

    // Check if this is the first user (owner)
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      // Create owner
      const user = await User.create({
        username,
        email,
        password,
        role: 'owner',
        level: 0,
        balance: 0,
        commissionRate: commissionRate || 0
      });

      sendTokenResponse(user, 201, res);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Owner already exists. Use create user endpoint to add users.'
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password, captcha } = req.body;

    // Validate input
    if (!username || !password || !captcha) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, password, and captcha'
      });
    }

    // Verify CAPTCHA
    if (!req.session.captcha) {
      return res.status(400).json({
        success: false,
        message: 'CAPTCHA expired. Please refresh.'
      });
    }

    if (Date.now() > req.session.captcha.expires) {
      delete req.session.captcha;
      return res.status(400).json({
        success: false,
        message: 'CAPTCHA expired. Please refresh.'
      });
    }

    if (captcha.toLowerCase() !== req.session.captcha.text) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CAPTCHA'
      });
    }

    // Clear used captcha
    delete req.session.captcha;

    // Check for user
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('parent', 'username email');

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        level: user.level,
        balance: user.balance,
        commissionRate: user.commissionRate,
        totalCommissionEarned: user.totalCommissionEarned,
        parent: user.parent,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching user data'
    });
  }
};
