const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  updateOrderStatus
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateOrderStatusSchema } = require('../utils/validators');

// All admin routes require authentication and ADMIN role
router.get('/orders', protect, authorize('ADMIN'), getAllOrders);
router.patch('/orders/:id/status', protect, authorize('ADMIN'), validate(updateOrderStatusSchema), updateOrderStatus);

module.exports = router;