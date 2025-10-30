const Joi = require('joi');

// Auth validators
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('USER', 'ADMIN').default('USER')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Product validators
const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().min(10).required(),
  price: Joi.number().min(0).required(),
  stock: Joi.object({
    availableStock: Joi.number().min(0).required()
  }).required()
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().min(10),
  price: Joi.number().min(0),
  stock: Joi.object({
    availableStock: Joi.number().min(0)
  })
}).min(1);

// Cart validators
const addCartItemSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().min(1).required()
});

// Order validators
const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('SHIPPED', 'DELIVERED').required()
});

module.exports = {
  registerSchema,
  loginSchema,
  createProductSchema,
  updateProductSchema,
  addCartItemSchema,
  updateOrderStatusSchema
};