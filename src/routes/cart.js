const express = require('express');
const router = express.Router();
const {
  getCart,
  addCartItem,
  removeCartItem
} = require('../controllers/cartController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { addCartItemSchema } = require('../utils/validators');

// All cart routes require authentication and USER role
router.get('/', protect, authorize('USER'), getCart);
router.post('/items', protect, authorize('USER'), validate(addCartItemSchema), addCartItem);
router.delete('/items/:productId', protect, authorize('USER'), removeCartItem);

module.exports = router;