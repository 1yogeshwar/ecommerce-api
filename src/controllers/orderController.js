const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Payment = require('../models/Payment');

// @desc    Checkout - Create order from cart with stock reservation
// @route   POST /api/orders/checkout
// @access  Private (User)
exports.checkout = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId')
      .session(session);

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate stock availability and reserve stock
    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.productId._id).session(session);

      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId.name} not found`
        });
      }

      // Check if sufficient stock is available
      if (product.stock.availableStock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.name}. Available: ${product.stock.availableStock}, Requested: ${item.quantity}`
        });
      }

      // Reserve stock atomically
      product.stock.availableStock -= item.quantity;
      product.stock.reservedStock += item.quantity;
      await product.save({ session });

      // Prepare order item
      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        priceAtPurchase: product.price
      });

      totalAmount += product.price * item.quantity;
    }

    // Create order with PENDING_PAYMENT status
    const paymentExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const order = await Order.create([{
      userId: req.user._id,
      items: orderItems,
      totalAmount,
      status: 'PENDING_PAYMENT',
      paymentExpiresAt
    }], { session });

    // Clear the cart
    await cart.clearCart();
    await cart.save({ session });

    // Commit transaction
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Order created successfully. Please complete payment within 15 minutes.',
      data: {
        order: order[0],
        paymentExpiresAt
      }
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Process payment for an order
// @route   POST /api/orders/:id/pay
// @access  Private (User)
exports.payOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find order
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify order belongs to user
    if (order.userId.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this order'
      });
    }

    // Check if order is in correct status
    if (order.status !== 'PENDING_PAYMENT') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot pay for order with status: ${order.status}`
      });
    }

    // Check if order is expired
    if (order.isExpired()) {
      // Release reserved stock
      for (const item of order.items) {
        const product = await Product.findById(item.productId).session(session);
        if (product) {
          product.stock.reservedStock -= item.quantity;
          product.stock.availableStock += item.quantity;
          await product.save({ session });
        }
      }

      order.status = 'CANCELLED';
      await order.save({ session });

      await session.commitTransaction();

      return res.status(400).json({
        success: false,
        message: 'Order has expired. Reserved stock has been released.'
      });
    }

    // Simulate payment processing (mock)
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const payment = await Payment.create([{
      orderId: order._id,
      transactionId,
      amount: order.totalAmount,
      status: 'SUCCESS'
    }], { session });

    // Update order status to PAID
    order.status = 'PAID';
    await order.save({ session });

    // Confirm sale - move from reserved to sold (just reduce reserved)
    for (const item of order.items) {
      const product = await Product.findById(item.productId).session(session);
      if (product) {
        product.stock.reservedStock -= item.quantity;
        await product.save({ session });
      }
    }

    // Commit transaction
    await session.commitTransaction();

    // TODO: Queue email job here (simulated)
    console.log(`📧 Email queued for order ${order._id}`);

    res.status(200).json({
      success: true,
      message: 'Payment successful! Order confirmed.',
      data: {
        order,
        payment: payment[0]
      }
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private (User)
exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find({ userId: req.user._id })
      .populate('items.productId', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments({ userId: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private (User)
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'name price description');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify order belongs to user
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};