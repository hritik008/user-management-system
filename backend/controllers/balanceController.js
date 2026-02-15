const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// @desc    Self recharge (Owner only)
// @route   POST /api/balance/recharge
// @access  Private (Owner only)
exports.recharge = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount'
      });
    }

    if (req.user.role !== 'owner') {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Only owner can recharge balance'
      });
    }

    const balanceBefore = req.user.balance;
    req.user.balance += amount;
    await req.user.save({ session });

    // Create transaction record
    await Transaction.create([{
      type: 'recharge',
      amount,
      receiver: req.user._id,
      balanceBefore,
      balanceAfter: req.user.balance,
      description: 'Self recharge by owner'
    }], { session });

    await session.commitTransaction();

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').to(req.user._id.toString()).emit('balanceUpdated', {
        balance: req.user.balance,
        transaction: {
          type: 'recharge',
          amount
        }
      });
    }

    res.json({
      success: true,
      message: 'Balance recharged successfully',
      balance: req.user.balance
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: 'Server error during recharge'
    });
  } finally {
    session.endSession();
  }
};

// @desc    Transfer balance to next-level user
// @route   POST /api/balance/transfer
// @access  Private
exports.transferBalance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { receiverId, amount } = req.body;

    if (!receiverId || !amount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Please provide receiver ID and amount'
      });
    }

    if (amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Get sender (current user)
    const sender = await User.findById(req.user._id).session(session);

    // Check if sender has sufficient balance
    if (sender.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Get receiver
    const receiver = await User.findById(receiverId).session(session);

    if (!receiver) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Check if receiver is direct child
    if (receiver.parent.toString() !== sender._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'You can only transfer to your direct children'
      });
    }

    // Calculate commission
    const commission = (amount * receiver.commissionRate) / 100;
    const netAmount = amount - commission;

    // Update balances
    const senderBalanceBefore = sender.balance;
    const receiverBalanceBefore = receiver.balance;

    sender.balance -= amount;
    receiver.balance += netAmount;
    
    if (commission > 0) {
      receiver.totalCommissionEarned += commission;
    }

    await sender.save({ session });
    await receiver.save({ session });

    // Create transaction records
    await Transaction.create([
      {
        type: 'debit',
        amount,
        sender: sender._id,
        receiver: receiver._id,
        balanceBefore: senderBalanceBefore,
        balanceAfter: sender.balance,
        commission,
        description: `Transfer to ${receiver.username}`
      }
    ], { session });

    await Transaction.create([
      {
        type: 'credit',
        amount: netAmount,
        sender: sender._id,
        receiver: receiver._id,
        balanceBefore: receiverBalanceBefore,
        balanceAfter: receiver.balance,
        commission,
        description: `Received from ${sender.username}`
      }
    ], { session });

    if (commission > 0) {
      await Transaction.create([
        {
          type: 'commission',
          amount: commission,
          sender: sender._id,
          receiver: receiver._id,
          balanceBefore: receiverBalanceBefore + netAmount,
          balanceAfter: receiver.balance,
          commission,
          description: `Commission on transfer from ${sender.username}`
        }
      ], { session });
    }

    await session.commitTransaction();

    // Emit socket events
    if (req.app.get('io')) {
      const io = req.app.get('io');
      
      io.to(sender._id.toString()).emit('balanceUpdated', {
        balance: sender.balance,
        transaction: {
          type: 'debit',
          amount,
          receiver: receiver.username
        }
      });

      io.to(receiver._id.toString()).emit('balanceUpdated', {
        balance: receiver.balance,
        transaction: {
          type: 'credit',
          amount: netAmount,
          sender: sender.username,
          commission
        }
      });
    }

    res.json({
      success: true,
      message: 'Balance transferred successfully',
      transfer: {
        amount,
        netAmount,
        commission,
        sender: {
          username: sender.username,
          newBalance: sender.balance
        },
        receiver: {
          username: receiver.username,
          newBalance: receiver.balance
        }
      }
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during transfer'
    });
  } finally {
    session.endSession();
  }
};

// @desc    Admin credit balance (deducted from parent)
// @route   POST /api/balance/admin-credit
// @access  Private (Admin/Owner)
exports.adminCredit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Please provide user ID and amount'
      });
    }

    if (amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Get target user
    const targetUser = await User.findById(userId).session(session);

    if (!targetUser) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is in admin's downline
    const downline = await req.user.getDownline();
    const isInDownline = downline.some(user => user._id.toString() === userId);

    if (!isInDownline && req.user._id.toString() !== userId) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'You can only credit users in your downline'
      });
    }

    // Get parent of target user
    if (!targetUser.parent) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Cannot credit to root user via admin credit'
      });
    }

    const parent = await User.findById(targetUser.parent).session(session);

    if (!parent) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Parent user not found'
      });
    }

    // Check parent has sufficient balance
    if (parent.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Parent (${parent.username}) has insufficient balance`
      });
    }

    // Calculate commission
    const commission = (amount * targetUser.commissionRate) / 100;
    const netAmount = amount - commission;

    // Update balances
    const parentBalanceBefore = parent.balance;
    const targetBalanceBefore = targetUser.balance;

    parent.balance -= amount;
    targetUser.balance += netAmount;
    
    if (commission > 0) {
      targetUser.totalCommissionEarned += commission;
    }

    await parent.save({ session });
    await targetUser.save({ session });

    // Create transaction records
    await Transaction.create([
      {
        type: 'debit',
        amount,
        sender: parent._id,
        receiver: targetUser._id,
        balanceBefore: parentBalanceBefore,
        balanceAfter: parent.balance,
        commission,
        description: `Admin credit to ${targetUser.username} (deducted from parent)`
      }
    ], { session });

    await Transaction.create([
      {
        type: 'credit',
        amount: netAmount,
        sender: parent._id,
        receiver: targetUser._id,
        balanceBefore: targetBalanceBefore,
        balanceAfter: targetUser.balance,
        commission,
        description: `Admin credit from ${parent.username}`
      }
    ], { session });

    if (commission > 0) {
      await Transaction.create([
        {
          type: 'commission',
          amount: commission,
          sender: parent._id,
          receiver: targetUser._id,
          balanceBefore: targetBalanceBefore + netAmount,
          balanceAfter: targetUser.balance,
          commission,
          description: `Commission on admin credit`
        }
      ], { session });
    }

    await session.commitTransaction();

    // Emit socket events
    if (req.app.get('io')) {
      const io = req.app.get('io');
      
      io.to(parent._id.toString()).emit('balanceUpdated', {
        balance: parent.balance,
        transaction: {
          type: 'debit',
          amount,
          receiver: targetUser.username
        }
      });

      io.to(targetUser._id.toString()).emit('balanceUpdated', {
        balance: targetUser.balance,
        transaction: {
          type: 'credit',
          amount: netAmount,
          sender: parent.username,
          commission
        }
      });
    }

    res.json({
      success: true,
      message: 'Balance credited successfully',
      credit: {
        amount,
        netAmount,
        commission,
        parent: {
          username: parent.username,
          newBalance: parent.balance
        },
        receiver: {
          username: targetUser.username,
          newBalance: targetUser.balance
        }
      }
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during admin credit'
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get balance statement
// @route   GET /api/balance/statement
// @access  Private
exports.getStatement = async (req, res) => {
  try {
    const { startDate, endDate, type, page = 1, limit = 50 } = req.query;

    const query = {
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    };

    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('sender', 'username email')
      .populate('receiver', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalTransactions: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching statement'
    });
  }
};

// @desc    Get current balance
// @route   GET /api/balance
// @access  Private
exports.getBalance = async (req, res) => {
  try {
    res.json({
      success: true,
      balance: req.user.balance,
      totalCommissionEarned: req.user.totalCommissionEarned
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching balance'
    });
  }
};
