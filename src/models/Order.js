const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    priceAtPurchase: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: [
        'PENDING_PAYMENT',
        'PAID',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED'
      ],
      default: 'PENDING_PAYMENT'
    },
    paymentExpiresAt: Date
  },
  { timestamps: true }
);

// ⏱ Check if payment expired
orderSchema.methods.isExpired = function () {
  if (!this.paymentExpiresAt) return false;
  return new Date() > this.paymentExpiresAt;
};

module.exports = mongoose.model('Order', orderSchema);
