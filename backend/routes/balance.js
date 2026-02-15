const express = require('express');
const router = express.Router();
const {
  recharge,
  transferBalance,
  adminCredit,
  getStatement,
  getBalance
} = require('../controllers/balanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All routes require authentication

router.get('/', getBalance);
router.get('/statement', getStatement);
router.post('/recharge', authorize('owner'), recharge);
router.post('/transfer', transferBalance);
router.post('/admin-credit', authorize('owner', 'admin'), adminCredit);

module.exports = router;
