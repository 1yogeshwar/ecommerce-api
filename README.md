# E-Commerce API

Backend API for an e-commerce platform with authentication, cart management, and order processing.

## Setup

```bash
npm install
cp .env.example .env
# Update .env with your MongoDB URI and JWT secret
npm run dev
```

## Environment Variables

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

## Project Structure

```
src/
├── models/         # Mongoose schemas
├── controllers/    # Request handlers
├── routes/         # API routes
├── middleware/     # Auth & validation
└── utils/          # Validation schemas
```

## Key Features

- JWT authentication with role-based access
- Order state management (pending → paid → shipped → delivered)
- Stock reservation during checkout prevents overselling
- MongoDB transactions for data consistency
- Payment timeout handling (15min expiration)

## API Routes

### Auth
- `POST /api/auth/register` - Sign up
- `POST /api/auth/login` - Get JWT token

### Products
- `GET /api/products` - List products (public)
- `POST /api/products` - Add product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Remove product (admin)

Query params: `?page=1&limit=10&sortBy=price&order=asc&name=search`

### Cart
- `GET /api/cart` - View cart
- `POST /api/cart/items` - Add/update item
- `DELETE /api/cart/items/:productId` - Remove item

### Orders
- `POST /api/orders/checkout` - Create order (reserves stock)
- `POST /api/orders/:id/pay` - Complete payment
- `GET /api/orders` - Order history
- `GET /api/orders/:id` - Order details

### Admin
- `GET /api/admin/orders` - All orders
- `PATCH /api/admin/orders/:id/status` - Update order status

## How It Works

1. User adds items to cart
2. Checkout creates order with status `PENDING_PAYMENT`
3. Stock gets reserved (moved to `reservedStock`)
4. Payment must complete within 15 minutes
5. Success: order becomes `PAID`, stock decremented
6. Failure/timeout: order `CANCELLED`, stock released

All checkout and payment operations use transactions - if anything fails, everything rolls back.

## Stock Management

```javascript
// Before checkout
availableStock: 100, reservedStock: 0

// After checkout (5 items)
availableStock: 95, reservedStock: 5

// After payment success
availableStock: 95, reservedStock: 0

// After payment failure
availableStock: 100, reservedStock: 0
```

## Testing

Import `postman_collection.json` and set:
- `base_url`: http://localhost:5000/api
- `user_token`: from login response
- `admin_token`: from admin login

Test flow:
1. Register and login as user
2. Create products as admin
3. Add products to cart
4. Checkout and pay
5. View order history

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^7.0.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.0",
  "joi": "^17.9.0",
  "dotenv": "^16.0.3",
  "cors": "^2.8.5"
}
```

## Notes

- Passwords are hashed with bcrypt
- Admin role must be set manually in database for first admin user
- Payment is simulated - no real payment gateway integration
- Stock expiration cleanup needs manual implementation or cron job

## License

MIT
