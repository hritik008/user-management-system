const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Create new user (next level)
// @route   POST /api/users
// @access  Private
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, commissionRate } = req.body;
    const creator = req.user;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password'
      });
    }

    // Create user at next level
    const newUser = await User.create({
      username,
      email,
      password,
      role: 'user',
      level: creator.level + 1,
      parent: creator._id,
      createdBy: creator._id,
      commissionRate: commissionRate || 0
    });

    // Emit socket event for real-time update
    if (req.app.get('io')) {
      req.app.get('io').to(creator._id.toString()).emit('userCreated', {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          level: newUser.level,
          balance: newUser.balance
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        level: newUser.level,
        balance: newUser.balance,
        commissionRate: newUser.commissionRate,
        parent: newUser.parent
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating user'
    });
  }
};

// @desc    Get direct children
// @route   GET /api/users/children
// @access  Private
exports.getDirectChildren = async (req, res) => {
  try {
    const children = await User.find({ parent: req.user._id })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: children.length,
      users: children
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching children'
    });
  }
};

// @desc    Get complete downline hierarchy
// @route   GET /api/users/downline
// @access  Private
exports.getDownline = async (req, res) => {
  try {
    const downline = await req.user.getDownline();

    res.json({
      success: true,
      count: downline.length,
      users: downline
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching downline'
    });
  }
};

// @desc    Get user hierarchy tree
// @route   GET /api/users/hierarchy/:userId?
// @access  Private
exports.getHierarchy = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    
    // Check authorization
    if (userId !== req.user._id.toString()) {
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if target user is in downline
      const downline = await req.user.getDownline();
      const isInDownline = downline.some(user => user._id.toString() === userId);
      
      if (!isInDownline) {
        return res.status(403).json({
          success: false,
          message: 'You can only view hierarchy of users in your downline'
        });
      }
    }

    const buildHierarchy = async (parentId) => {
      const user = await User.findById(parentId).select('-password');
      if (!user) return null;

      const children = await User.find({ parent: parentId }).select('-password');
      
      const hierarchy = {
        id: user._id,
        username: user.username,
        email: user.email,
        level: user.level,
        balance: user.balance,
        role: user.role,
        commissionRate: user.commissionRate,
        totalCommissionEarned: user.totalCommissionEarned,
        children: []
      };

      for (const child of children) {
        const childHierarchy = await buildHierarchy(child._id);
        if (childHierarchy) {
          hierarchy.children.push(childHierarchy);
        }
      }

      return hierarchy;
    };

    const hierarchy = await buildHierarchy(userId);

    res.json({
      success: true,
      hierarchy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error building hierarchy'
    });
  }
};

// @desc    Change password of next-level user
// @route   PUT /api/users/:userId/password
// @access  Private
exports.changeUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const targetUser = req.targetUser;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user is direct child
    if (targetUser.parent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only change password of your direct children'
      });
    }

    targetUser.password = newPassword;
    await targetUser.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:userId
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('parent', 'username email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is in downline
    if (req.user._id.toString() !== user._id.toString()) {
      const downline = await req.user.getDownline();
      const isInDownline = downline.some(u => u._id.toString() === user._id.toString());
      
      if (!isInDownline) {
        return res.status(403).json({
          success: false,
          message: 'You can only view users in your downline'
        });
      }
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching user'
    });
  }
};

// @desc    Get balance summary
// @route   GET /api/users/summary/balance
// @access  Private (Admin/Owner)
exports.getBalanceSummary = async (req, res) => {
  try {
    const downline = await req.user.getDownline();
    const allUsers = [req.user, ...downline];

    const summary = {
      totalUsers: allUsers.length,
      totalBalance: allUsers.reduce((sum, user) => sum + user.balance, 0),
      totalCommission: allUsers.reduce((sum, user) => sum + user.totalCommissionEarned, 0),
      usersByLevel: {}
    };

    allUsers.forEach(user => {
      if (!summary.usersByLevel[user.level]) {
        summary.usersByLevel[user.level] = {
          count: 0,
          totalBalance: 0
        };
      }
      summary.usersByLevel[user.level].count++;
      summary.usersByLevel[user.level].totalBalance += user.balance;
    });

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching balance summary'
    });
  }
};
