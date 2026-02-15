# Quick Start Guide

## Prerequisites
- Node.js v18 or higher
- MongoDB v6 or higher
- npm or yarn

## Installation (5 minutes)

### Option 1: Automated Setup (Recommended)
```bash
# Clone the repository
git clone <repository-url>
cd user-management-system

# Run setup script
chmod +x setup.sh
./setup.sh

# Start MongoDB
sudo systemctl start mongodb
# OR using Docker:
# docker run -d -p 27017:27017 --name mongodb mongo:latest

# Terminal 1 - Start Backend
cd backend
npm run dev

# Terminal 2 - Start Frontend
cd frontend
npm start
```

### Option 2: Manual Setup
```bash
# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env and set JWT_SECRET and SESSION_SECRET

# Frontend setup
cd frontend
npm install
```

### Option 3: Docker Setup
```bash
docker-compose up -d
```

## First Time Setup

### 1. Create Owner Account
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "owner",
    "email": "owner@example.com",
    "password": "password123"
  }'
```

### 2. Login
1. Open http://localhost:4200
2. Get CAPTCHA (automatically loaded)
3. Enter credentials
4. Click Login

### 3. Recharge Balance (Owner Only)
```bash
curl -X POST http://localhost:5000/api/balance/recharge \
  -H "Content-Type: application/json" \
  -b "token=YOUR_JWT_TOKEN" \
  -d '{"amount": 10000}'
```

## Common Workflows

### Create a New User
1. Login to dashboard
2. Click "Add New User"
3. Fill in details (username, email, password)
4. Set commission rate (optional)
5. Click "Create User"

### Transfer Balance
1. Go to "Transfer" page
2. Select recipient (must be direct child)
3. Enter amount
4. Confirm transfer

### View Hierarchy
1. Go to "Hierarchy" page
2. View tree structure
3. Click on any user to see their downline

### Check Transactions
1. Go to "Transactions" page
2. View all credit/debit transactions
3. Filter by type or date range

## Testing with Postman

1. Import `postman_collection.json`
2. Set environment variable `baseUrl` to `http://localhost:5000/api`
3. Run requests in order:
   - Get CAPTCHA
   - Login (saves token automatically)
   - Create users
   - Transfer balance

## Default Ports
- Frontend: http://localhost:4200
- Backend: http://localhost:5000
- MongoDB: 27017

## Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
sudo systemctl status mongodb

# Start MongoDB
sudo systemctl start mongodb
```

### Port Already in Use
```bash
# Check what's using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### CORS Issues
- Ensure `CLIENT_URL` in backend `.env` matches frontend URL
- Default: `http://localhost:4200`

### JWT Token Issues
- Clear browser cookies
- Logout and login again
- Check `JWT_SECRET` in `.env`

## Features Checklist

### Authentication ✓
- [x] JWT with HTTP-only cookies
- [x] CAPTCHA verification
- [x] Session management
- [x] Secure logout

### User Hierarchy ✓
- [x] N-level hierarchy
- [x] Create next-level users
- [x] View downline
- [x] Change child passwords

### Balance Management ✓
- [x] Self recharge (owner)
- [x] Transfer to children
- [x] Admin credit
- [x] Transaction history

### Bonus Features ✓
- [x] Commission system
- [x] Real-time updates (Socket.IO)
- [x] Session-based CAPTCHA
- [x] Responsive UI
- [x] Docker support

## Next Steps

1. Explore the dashboard
2. Create user hierarchy
3. Test balance transfers
4. View transaction history
5. Check real-time updates

## Support

For detailed documentation, see [README.md](./README.md)

For API documentation, see Postman collection or Swagger docs (if implemented)

For issues, create a GitHub issue or contact support.
