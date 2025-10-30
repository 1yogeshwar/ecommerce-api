const express = require('express');
const router = express.Router();
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createProductSchema, updateProductSchema } = require('../utils/validators');

// Public routes
router.get('/', getProducts);

// Admin only routes
router.post('/', protect, authorize('ADMIN'), validate(createProductSchema), createProduct);
router.put('/:id', protect, authorize('ADMIN'), validate(updateProductSchema), updateProduct);
router.delete('/:id', protect, authorize('ADMIN'), deleteProduct);

module.exports = router;