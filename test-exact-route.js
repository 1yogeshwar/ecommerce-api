// Test the exact route setup
const express = require('express');
const router = express.Router();

console.log('1. Importing authController...');
const authController = require('./src/controllers/authController');
console.log('   register:', typeof authController.register);
console.log('   login:', typeof authController.login);

console.log('\n2. Importing validate middleware...');
const validate = require('./src/middleware/validate');
console.log('   validate:', typeof validate);

console.log('\n3. Importing validators...');
const validators = require('./src/utils/validators');
console.log('   registerSchema:', typeof validators.registerSchema);

console.log('\n4. Creating validation middleware...');
const validateRegister = validate(validators.registerSchema);
console.log('   validateRegister:', typeof validateRegister);

console.log('\n5. Destructuring register function...');
const { register, login } = authController;
console.log('   register:', typeof register);
console.log('   login:', typeof login);

console.log('\n6. Setting up route...');
try {
  router.post('/register', validateRegister, register);
  console.log('   ✅ Route setup successful!');
} catch (err) {
  console.log('   ❌ Route setup failed:', err.message);
}

console.log('\n7. Checking what router.post received:');
console.log('   Path: /register');
console.log('   Middleware 1 (validateRegister):', typeof validateRegister);
console.log('   Middleware 2 (register):', typeof register);