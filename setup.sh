#!/bin/bash

# Multi-Level User Management System - Setup Script
# This script automates the setup process for the application

set -e

echo "=================================="
echo "User Management System Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) is installed"

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    print_info "MongoDB is not installed locally. You can:"
    echo "  1. Install MongoDB locally"
    echo "  2. Use Docker: docker run -d -p 27017:27017 mongo:latest"
    echo "  3. Use MongoDB Atlas (cloud)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_success "MongoDB is installed"
fi

# Setup Backend
echo ""
print_info "Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    print_info "Creating .env file from template..."
    cp .env.example .env
    
    # Generate random secrets
    JWT_SECRET=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 32)
    
    # Update .env with generated secrets
    sed -i "s/your_super_secret_jwt_key_change_this_in_production/$JWT_SECRET/" .env
    sed -i "s/your_session_secret_key_change_this/$SESSION_SECRET/" .env
    
    print_success ".env file created with generated secrets"
else
    print_info ".env file already exists"
fi

print_info "Installing backend dependencies..."
npm install
print_success "Backend dependencies installed"

cd ..

# Setup Frontend
echo ""
print_info "Setting up frontend..."
cd frontend

print_info "Installing frontend dependencies..."
npm install
print_success "Frontend dependencies installed"

cd ..

# Final instructions
echo ""
echo "=================================="
print_success "Setup completed successfully!"
echo "=================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start MongoDB:"
echo "   sudo systemctl start mongodb"
echo "   OR"
echo "   docker run -d -p 27017:27017 --name mongodb mongo:latest"
echo ""
echo "2. Start the backend (in a new terminal):"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "3. Start the frontend (in another terminal):"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "4. Access the application:"
echo "   Frontend: http://localhost:4200"
echo "   Backend:  http://localhost:5000"
echo ""
echo "5. Create the owner account:"
echo "   curl -X POST http://localhost:5000/api/auth/register \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"username\":\"owner\",\"email\":\"owner@example.com\",\"password\":\"password123\"}'"
echo ""
echo "=================================="
echo "For Docker setup:"
echo "  docker-compose up -d"
echo "=================================="
