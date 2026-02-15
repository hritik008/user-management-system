# Project Structure Overview

## Complete File Structure

```
user-management-system/
│
├── backend/                          # Express.js Backend
│   ├── controllers/                  # Business logic
│   │   ├── authController.js         # Authentication & CAPTCHA
│   │   ├── userController.js         # User management
│   │   └── balanceController.js      # Balance & transactions
│   │
│   ├── middleware/                   # Express middleware
│   │   └── auth.js                   # JWT & authorization
│   │
│   ├── models/                       # Mongoose schemas
│   │   ├── User.js                   # User model with hierarchy
│   │   └── Transaction.js            # Transaction history
│   │
│   ├── routes/                       # API routes
│   │   ├── auth.js                   # /api/auth/*
│   │   ├── users.js                  # /api/users/*
│   │   └── balance.js                # /api/balance/*
│   │
│   ├── .env.example                  # Environment template
│   ├── package.json                  # Dependencies
│   └── server.js                     # Main entry point
│
├── frontend/                         # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/          # UI components
│   │   │   │   ├── login/           # Login with CAPTCHA
│   │   │   │   └── dashboard/       # Main dashboard
│   │   │   │
│   │   │   ├── services/            # API services
│   │   │   │   ├── auth.service.ts  # Authentication
│   │   │   │   ├── user.service.ts  # User management
│   │   │   │   ├── balance.service.ts # Transactions
│   │   │   │   └── websocket.service.ts # Real-time
│   │   │   │
│   │   │   ├── guards/              # Route protection
│   │   │   │   └── auth.guard.ts
│   │   │   │
│   │   │   ├── app.module.ts        # Main module
│   │   │   ├── app-routing.module.ts # Routes
│   │   │   └── app.component.ts     # Root component
│   │   │
│   │   ├── environments/            # Config
│   │   │   ├── environment.ts       # Development
│   │   │   └── environment.prod.ts  # Production
│   │   │
│   │   ├── index.html               # Entry HTML
│   │   ├── main.ts                  # Bootstrap
│   │   └── styles.scss              # Global styles
│   │
│   ├── angular.json                 # Angular config
│   ├── package.json                 # Dependencies
│   └── tsconfig.json                # TypeScript config
│
├── docker-compose.yml               # Docker orchestration
├── Dockerfile.backend               # Backend container
├── Dockerfile.frontend              # Frontend container
├── postman_collection.json          # API testing
├── setup.sh                         # Automated setup
├── .gitignore                       # Git ignore rules
├── README.md                        # Full documentation
└── QUICKSTART.md                    # Quick start guide

```

## Architecture Overview

### Backend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Express Server                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Session    │  │   Cookie     │  │     CORS     │  │
│  │  Middleware  │  │   Parser     │  │  Middleware  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│                      JWT Auth                            │
│              (HTTP-only Cookies)                         │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │     Auth     │  │    Users     │  │   Balance    │  │
│  │    Routes    │  │    Routes    │  │    Routes    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │     Auth     │  │    Users     │  │   Balance    │  │
│  │ Controllers  │  │ Controllers  │  │ Controllers  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │           Mongoose Models (MongoDB)               │  │
│  │    User Model  │  Transaction Model              │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                    Socket.IO Server                      │
│              (Real-time Updates)                         │
└─────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Angular Application                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Login     │  │  Dashboard   │  │   Other      │  │
│  │  Component   │  │  Component   │  │ Components   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│                    Auth Guard                            │
│              (Route Protection)                          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │     Auth     │  │    User      │  │   Balance    │  │
│  │   Service    │  │   Service    │  │   Service    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │            WebSocket Service                      │  │
│  │         (Real-time Communication)                 │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                  HTTP Client Module                      │
│              (API Communication)                         │
└─────────────────────────────────────────────────────────┘
```

## Key Features Implementation

### 1. Authentication Flow
```
User → Login Form → CAPTCHA Validation → JWT Token → HTTP-only Cookie → Protected Routes
```

### 2. User Hierarchy Flow
```
Owner (L0)
  ├── Admin (L1)
  │     ├── User (L2)
  │     │     └── User (L3)
  │     └── User (L2)
  └── Admin (L1)
        └── User (L2)
```

### 3. Balance Transfer Flow
```
1. User initiates transfer
2. Validate parent-child relationship
3. Check sufficient balance
4. Calculate commission
5. Start MongoDB transaction
6. Deduct from sender
7. Credit to receiver (net amount)
8. Create transaction records
9. Commit transaction
10. Emit WebSocket events
11. Update UI in real-time
```

### 4. Real-time Updates
```
Backend Change → Socket.IO Emit → Frontend Listener → UI Update
```

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: String (owner/admin/user),
  level: Number,
  parent: ObjectId (ref: User),
  balance: Number,
  commissionRate: Number,
  totalCommissionEarned: Number,
  isActive: Boolean,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Collection
```javascript
{
  _id: ObjectId,
  type: String (credit/debit/commission/recharge),
  amount: Number,
  sender: ObjectId (ref: User),
  receiver: ObjectId (ref: User),
  balanceBefore: Number,
  balanceAfter: Number,
  commission: Number,
  description: String,
  status: String (pending/completed/failed),
  createdAt: Date,
  updatedAt: Date
}
```

## Security Measures

1. **JWT in HTTP-only Cookies**: XSS protection
2. **CAPTCHA**: Bot protection
3. **Password Hashing**: bcrypt with salt
4. **CORS Configuration**: Restrict origins
5. **Session-based CAPTCHA**: 5-minute expiry
6. **Role-based Access Control**: Hierarchical permissions
7. **Input Validation**: Express validator
8. **MongoDB Transactions**: Data consistency

## Performance Optimizations

1. **Database Indexes**: On frequently queried fields
2. **Pagination**: Default 50 items per page
3. **Lazy Loading**: Hierarchy loaded on demand
4. **WebSocket Rooms**: Users in personal rooms
5. **Efficient Queries**: Populate only needed fields

## Technology Versions

- Node.js: v18+
- Express: v4.18+
- MongoDB: v6+
- Mongoose: v8+
- Angular: v17
- Socket.IO: v4.6+
- Angular Material: v17

## API Endpoints Summary

### Authentication
- GET `/api/auth/captcha` - Get CAPTCHA
- POST `/api/auth/register` - Register owner
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- GET `/api/auth/me` - Get current user

### Users
- POST `/api/users` - Create user
- GET `/api/users/children` - Get direct children
- GET `/api/users/downline` - Get downline
- GET `/api/users/hierarchy/:userId?` - Get hierarchy
- GET `/api/users/:userId` - Get user by ID
- PUT `/api/users/:userId/password` - Change password
- GET `/api/users/summary/balance` - Get balance summary

### Balance
- GET `/api/balance` - Get balance
- POST `/api/balance/recharge` - Recharge (owner only)
- POST `/api/balance/transfer` - Transfer balance
- POST `/api/balance/admin-credit` - Admin credit
- GET `/api/balance/statement` - Get transactions

## WebSocket Events

### Emitted by Server
- `balanceUpdated` - When balance changes
- `userCreated` - When new user added

### Client Actions
- Connect with JWT token
- Join personal room
- Listen for events
- Update UI

## Testing Scenarios

1. Owner creates hierarchy
2. Balance recharge and distribution
3. User transfers to children
4. Admin credits to downline
5. Password changes
6. Real-time notifications
7. Transaction history
8. Commission calculations

## Deployment Checklist

- [ ] Update environment variables
- [ ] Set secure JWT secrets
- [ ] Configure MongoDB connection
- [ ] Enable HTTPS in production
- [ ] Set up SSL certificates
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up logging
- [ ] Configure backup strategy
- [ ] Monitor server health
