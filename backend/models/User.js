const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'user'],
    default: 'user'
  },
  level: {
    type: Number,
    required: true,
    default: 0
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative']
  },
  commissionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalCommissionEarned: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get all downline users recursively
userSchema.methods.getDownline = async function() {
  const downline = [];
  
  const findChildren = async (userId) => {
    const children = await this.model('User').find({ parent: userId });
    for (const child of children) {
      downline.push(child);
      await findChildren(child._id);
    }
  };
  
  await findChildren(this._id);
  return downline;
};

// Get direct children
userSchema.methods.getDirectChildren = async function() {
  return await this.model('User').find({ parent: this._id });
};

module.exports = mongoose.model('User', userSchema);
