const express = require('express');
const router = express.Router();
const {
  checkout,
  payOrder,
  getMyOrders,
  getOrder
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// All order routes require authentication and USER role
router.post('/checkout', protect, authorize('USER'), checkout);
router.post('/:id/pay', protect, authorize('USER'), payOrder);
router.get('/', protect, authorize('USER'), getMyOrders);
router.get('/:id', protect, authorize('USER'), getOrder);

module.exports = router;