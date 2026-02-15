const express = require('express');
const router = express.Router();
const {
  createUser,
  getDirectChildren,
  getDownline,
  getHierarchy,
  changeUserPassword,
  getUserById,
  getBalanceSummary
} = require('../controllers/userController');
const { protect, authorize, canModifyUser } = require('../middleware/auth');

router.use(protect); // All routes require authentication

router.post('/', createUser);
router.get('/children', getDirectChildren);
router.get('/downline', getDownline);
router.get('/hierarchy/:userId?', getHierarchy);
router.get('/summary/balance', authorize('owner', 'admin'), getBalanceSummary);
router.get('/:userId', getUserById);
router.put('/:userId/password', canModifyUser, changeUserPassword);

module.exports = router;
