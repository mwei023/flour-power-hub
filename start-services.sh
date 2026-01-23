#!/bin/bash

# 🚀 Flour Power Hub - Startup Script
# Run this after restarting your laptop

set -e

echo "=========================================="
echo "🌾 Flour Power Hub - Starting Services"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Check if PostgreSQL is running
echo ""
echo "Step 1: Checking PostgreSQL..."
if pg_isready -q 2>/dev/null; then
    print_status "PostgreSQL is running"
else
    print_warning "PostgreSQL not detected. Make sure your database is running."
    print_warning "If using local PostgreSQL: sudo systemctl start postgresql"
    print_warning "If using Docker: docker compose up -d postgres"
fi

# Step 2: Start the Backend API
echo ""
echo "Step 2: Starting Backend API..."
cd /home/mwei/flour-power-hub/backend

# Kill any existing backend processes
if lsof -ti:3001 >/dev/null 2>&1; then
    print_warning "Port 3001 in use, killing existing process..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Start the backend in background
nohup npx tsx src/app.ts > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
print_status "Backend started (PID: $BACKEND_PID)"

# Wait for backend to start
echo "Waiting for backend to initialize..."
for i in {1..10}; do
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        print_status "Backend is ready!"
        break
    fi
    sleep 1
done

# Verify backend
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    print_status "Backend health check passed"
else
    print_error "Backend health check failed. Check /tmp/backend.log"
fi

# Step 3: Start Cloudflare Tunnel
echo ""
echo "Step 3: Starting Cloudflare Tunnel..."

# Kill any existing cloudflared processes
if pgrep -f "cloudflared.*tunnel run" >/dev/null 2>&1; then
    print_warning "Existing cloudflared tunnel detected, stopping it first..."
    sudo pkill -f "cloudflared.*tunnel run" 2>/dev/null || true
    sleep 2
fi

# Start cloudflared tunnel in background
sudo cloudflared --no-autoupdate --config /etc/cloudflared/config.yml tunnel run &
CLOUDFLARED_PID=$!
print_status "Cloudflare Tunnel started"

# Wait for tunnel to connect
echo "Waiting for tunnel to connect to Cloudflare..."
sleep 5

# Verify tunnel
if pgrep -f "cloudflared.*tunnel run" >/dev/null 2>&1; then
    print_status "Cloudflare Tunnel is running"
    cloudflared tunnel list 2>/dev/null | head -5 || true
else
    print_error "Cloudflare Tunnel failed to start"
fi

# Step 4: Verify API via HTTPS
echo ""
echo "Step 4: Testing HTTPS API endpoint..."
if curl -s --max-time 10 https://amani.mwei.co.ke/api/v1/health >/dev/null 2>&1; then
    print_status "HTTPS API is accessible!"
    echo ""
    echo "Health check response:"
    curl -s https://amani.mwei.co.ke/api/v1/health | head -100
else
    print_warning "HTTPS API not accessible yet. This may take a few seconds..."
    echo "Trying again..."
    sleep 5
    if curl -s --max-time 10 https://amani.mwei.co.ke/api/v1/health >/dev/null 2>&1; then
        print_status "HTTPS API is now accessible!"
    else
        print_error "HTTPS API not accessible. Check tunnel logs."
    fi
fi

# Summary
echo ""
echo "=========================================="
echo "🌾 Services Started Successfully!"
echo "=========================================="
echo ""
echo "📝 Quick Reference:"
echo "   • Backend API:    http://localhost:3001 (local)"
echo "   • HTTPS API:      https://amani.mwei.co.ke/api/v1"
echo "   • Health Check:   https://amani.mwei.co.ke/api/v1/health"
echo ""
echo "🛠️  Useful Commands:"
echo "   • View backend logs:    tail -f /tmp/backend.log"
echo "   • Check tunnel status:  cloudflared tunnel list"
echo "   • Stop all services:    pkill -f 'tsx|npx' && sudo pkill cloudflared"
echo ""
echo "📄 Documentation: /home/mwei/flour-power-hub/TODO_SSL_FIX.md"
echo ""

