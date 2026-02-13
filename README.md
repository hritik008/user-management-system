# Multi-Level User Management System

A comprehensive MEAN stack application for managing multi-level user hierarchies with balance transfers, real-time updates, and secure authentication.

## Features

### Core Features
- ✅ **JWT Authentication** with HTTP-only cookies
- ✅ **CAPTCHA verification** during login (5-minute session expiry)
- ✅ **N-level User Hierarchy** - unlimited depth
- ✅ **Role-based Access Control** (Owner, Admin, User)
- ✅ **Balance Management** with transaction history
- ✅ **Real-time Updates** using Socket.IO
- ✅ **Commission System** on transfers
- ✅ **Secure Password Management**

### Technical Features
- MongoDB with transactions for data consistency
- JWT refresh token support
- Session-based CAPTCHA with expiry
- WebSocket for real-time balance updates
- Responsive Material Design UI
- RESTful API architecture
- Comprehensive error handling

## Technology Stack

### Backend
- **Node.js** & **Express.js**
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Socket.IO** for real-time communication
- **svg-captcha** for CAPTCHA generation
- **bcryptjs** for password hashing

### Frontend
- **Angular 17**
- **Angular Material** for UI components
- **RxJS** for reactive programming
- **Socket.IO Client** for WebSocket
- **TypeScript**

## Project Structure

```
user-management-system/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   └── balanceController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── Transaction.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   └── balance.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── guards/
│   │   │   └── app.module.ts
│   │   ├── environments/
│   │   └── index.html
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn
- Angular CLI (optional, for development)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd user-management-system
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - MONGODB_URI
# - JWT_SECRET
# - SESSION_SECRET
```

**Environment Variables (.env):**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/user_management
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=24h
JWT_COOKIE_EXPIRE=1
CAPTCHA_EXPIRE=300000
SESSION_SECRET=your_session_secret_key_change_this
CLIENT_URL=http://localhost:4200
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Update environment if needed
# Edit src/environments/environment.ts
```

### 4. Database Setup

Ensure MongoDB is running:

```bash
# Start MongoDB service
sudo systemctl start mongodb

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:4200
- Backend API: http://localhost:5000

## Docker Setup (Alternative)

```bash
# Build and start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
```

## Initial Setup

### Create Owner Account

The first user must be created as the Owner through the registration endpoint:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "owner",
    "email": "owner@example.com",
    "password": "securepassword123"
  }'
```

Or use the registration endpoint directly (only works when no users exist).

### Login

1. Navigate to http://localhost:4200
2. Get CAPTCHA (auto-loaded)
3. Enter credentials
4. Submit login form

## API Documentation

### Authentication Endpoints

#### Get CAPTCHA
```http
GET /api/auth/captcha
```

#### Register (Owner Only)
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "owner",
  "email": "owner@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "owner",
  "password": "password123",
  "captcha": "ABC123"
}
```

#### Logout
```http
POST /api/auth/logout
Cookie: token=<jwt-token>
```

#### Get Current User
```http
GET /api/auth/me
Cookie: token=<jwt-token>
```

### User Management Endpoints

#### Create User (Next Level)
```http
POST /api/users
Cookie: token=<jwt-token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "commissionRate": 5
}
```

#### Get Direct Children
```http
GET /api/users/children
Cookie: token=<jwt-token>
```

#### Get Complete Downline
```http
GET /api/users/downline
Cookie: token=<jwt-token>
```

#### Get Hierarchy Tree
```http
GET /api/users/hierarchy/:userId?
Cookie: token=<jwt-token>
```

#### Change User Password
```http
PUT /api/users/:userId/password
Cookie: token=<jwt-token>
Content-Type: application/json

{
  "newPassword": "newpassword123"
}
```

#### Get Balance Summary (Admin/Owner)
```http
GET /api/users/summary/balance
Cookie: token=<jwt-token>
```

### Balance Management Endpoints

#### Get Balance
```http
GET /api/balance
Cookie: token=<jwt-token>
```

#### Self Recharge (Owner Only)
```http
POST /api/balance/recharge
Cookie: token=<jwt-token>
Content-Type: application/json

{
  "amount": 10000
}
```

#### Transfer Balance
```http
POST /api/balance/transfer
Cookie: token=<jwt-token>
Content-Type: application/json

{
  "receiverId": "user-id-here",
  "amount": 500
}
```

#### Admin Credit
```http
POST /api/balance/admin-credit
Cookie: token=<jwt-token>
Content-Type: application/json

{
  "userId": "user-id-here",
  "amount": 1000
}
```

#### Get Transaction Statement
```http
GET /api/balance/statement?page=1&limit=50&type=credit
Cookie: token=<jwt-token>
```

## User Hierarchy Rules

1. **Owner (Level 0)**
   - Can create admin/users at level 1
   - Can self-recharge balance
   - Can view entire hierarchy
   - Can credit balance to anyone in downline

2. **Admin (Level N)**
   - Can create users at level N+1
   - Can view their complete downline
   - Can credit balance to anyone in downline
   - Balance deducted from immediate parent

3. **User (Level N)**
   - Can create users at level N+1
   - Can transfer to direct children only
   - Can view own downline
   - Can change password of direct children only

## Balance Transfer Flow

### Normal Transfer (User to Child)
1. User initiates transfer to direct child
2. Amount deducted from sender
3. Commission calculated (if any)
4. Net amount credited to receiver
5. Transaction records created for both parties
6. Real-time notifications sent via WebSocket

### Admin Credit
1. Admin selects any user in downline
2. Amount deducted from user's parent
3. Commission calculated
4. Net amount credited to user
5. Both parent and user notified

## Commission System

- Each user can have a commission rate (0-100%)
- Commission deducted from transferred amount
- Example: Transfer $100 with 5% commission
  - Sender: -$100
  - Receiver: +$95
  - Commission recorded: $5

## Real-Time Features

The system uses Socket.IO for real-time updates:

1. **Balance Updates**: Instant notification when balance changes
2. **User Creation**: Notification when new users are added to downline
3. **Transaction Alerts**: Real-time transaction notifications

### WebSocket Events

```javascript
// Balance updated
socket.on('balanceUpdated', (data) => {
  // { balance: 1000, transaction: {...} }
});

// User created
socket.on('userCreated', (data) => {
  // { user: {...} }
});
```

## Security Features

### Authentication
- JWT tokens stored in HTTP-only cookies
- Token expiration: 24 hours (configurable)
- Secure cookie flags in production
- CSRF protection via SameSite cookies

### CAPTCHA
- SVG-based CAPTCHA generation
- 5-minute expiry
- Session-based storage
- One-time use

### Password Security
- bcrypt hashing with salt rounds
- Minimum 6 characters
- Passwords never returned in API responses

### Authorization
- Role-based access control
- Hierarchical permissions
- Parent-child relationship validation
- Downline verification

## Testing

### Manual Testing with Postman

Import the Postman collection (see `postman_collection.json`).

### Test Scenarios

1. **Owner Setup**
   - Register owner account
   - Login and verify JWT cookie
   - Recharge balance

2. **User Hierarchy**
   - Create Level 1 users
   - Create Level 2 users from Level 1
   - Verify hierarchy tree

3. **Balance Transfers**
   - Transfer from owner to Level 1
   - Transfer from Level 1 to Level 2
   - Verify commission calculations

4. **Admin Features**
   - View complete downline
   - Admin credit to any user
   - View balance summary

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/user_management
```

### CORS Issues
```javascript
// Ensure CLIENT_URL in .env matches frontend URL
CLIENT_URL=http://localhost:4200
```

### WebSocket Connection Issues
```javascript
// Check Socket.IO URL in frontend environment
socketUrl: 'http://localhost:5000'
```

### JWT Token Issues
```bash
# Clear browser cookies
# Generate new JWT_SECRET in .env
# Restart backend server
```

## Performance Optimization

1. **Database Indexes**: Added on frequently queried fields
2. **Transaction Pagination**: Default 50 items per page
3. **Lazy Loading**: Hierarchy loaded on demand
4. **WebSocket Rooms**: Users joined to personal rooms

## Best Practices

1. **Always use transactions** for balance operations
2. **Validate user relationships** before operations
3. **Log important events** for audit trail
4. **Rate limit** sensitive endpoints
5. **Use environment variables** for configuration
6. **Keep JWT secrets secure** and rotate regularly

## Future Enhancements

- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] Advanced reporting and analytics
- [ ] Export transactions to CSV/PDF
- [ ] Mobile application
- [ ] Multi-currency support
- [ ] Batch operations
- [ ] API rate limiting
- [ ] Advanced search and filters

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue on GitHub
- Email: support@example.com

## Acknowledgments

- Angular Team for the excellent framework
- MongoDB for the robust database
- Socket.IO for real-time capabilities
- Material Design for UI components
#   u s e r - m a n a g e m e n t - s y s t e m  
 