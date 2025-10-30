const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private (User)
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId', 'name price description stock');

    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.productId.price * item.quantity);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        cart,
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update item in cart
// @route   POST /api/cart/items
// @access  Private (User)
exports.addCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    // Check if product exists and has sufficient stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stock.availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    // Add or update item
    await cart.addItem(productId, quantity);

    // Populate and return
    cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId', 'name price description stock');

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:productId
// @access  Private (User)
exports.removeCartItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    await cart.removeItem(req.params.productId);

    const updatedCart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId', 'name price description stock');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: { cart: updatedCart }
    });
  } catch (error) {
    next(error);
  }
};