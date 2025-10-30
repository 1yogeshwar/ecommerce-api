const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
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
    }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    items: [cartItemSchema]
  },
  { timestamps: true }
);

/**
 * 📦 Add or update an item in the cart
 */
cartSchema.methods.addItem = async function (productId, quantity) {
  const existingItem = this.items.find(
    item => item.productId.toString() === productId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({ productId, quantity });
  }

  await this.save();
  return this;
};

/**
 * ❌ Remove an item from the cart
 */
cartSchema.methods.removeItem = async function (productId) {
  this.items = this.items.filter(
    item => item.productId.toString() !== productId.toString()
  );

  await this.save();
  return this;
};

module.exports = mongoose.model('Cart', cartSchema);
