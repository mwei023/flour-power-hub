#!/bin/bash

# ============================================
# FREE DEPLOYMENT SCRIPT
# Deploy Flour Power Hub for FREE
# ============================================

echo "🚀 Flour Power Hub - Free Deployment Script"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if git is initialized
print_status "Checking git repository..."
if [ ! -d ".git" ]; then
    print_warning "Git not initialized. Initializing now..."
    git init
    git add .
    git commit -m "Initial commit - Flour Power Hub PWA"
    print_success "Git initialized"
else
    print_success "Git repository exists"
fi

# Check if GitHub remote exists
print_status "Checking GitHub remote..."
if ! git remote get-url origin &> /dev/null; then
    print_warning "GitHub remote not set. Please add it:"
    echo ""
    echo "  git remote add origin https://github.com/YOUR_USERNAME/flour-power-hub.git"
    echo "  git push -u origin main"
    echo ""
else
    print_success "GitHub remote exists: $(git remote get-url origin)"
fi

echo ""
echo "============================================"
echo "📦 DEPLOYMENT OPTIONS"
echo "============================================"
echo ""
echo "1️⃣  Deploy Frontend (Vercel) - FREE"
echo "2️⃣  Deploy Backend (Railway) - FREE"
echo "3️⃣  Setup Database (Neon) - FREE"
echo "4️⃣  Quick Deploy All (Interactive)"
echo "5️⃣  View Deployment Guide"
echo "6️⃣  Exit"
echo ""

read -p "Choose an option (1-6): " choice

case $choice in
    1)
        echo ""
        echo "============================================"
        echo "🚀 Deploying Frontend to Vercel (FREE)"
        echo "============================================"
        echo ""
        echo "Steps:"
        echo "1. Go to https://vercel.com"
        echo "2. Sign up with GitHub"
        echo "3. Click 'Add New Project'"
        echo "4. Import your repository"
        echo ""
        echo "Configure in Vercel:"
        echo "  - Framework Preset: Vite"
        echo "  - Build Command: npm run build"
        echo "  - Output Directory: dist"
        echo ""
        echo "Environment Variables to add:"
        echo "  VITE_API_BASE_URL=https://your-backend.railway.app/api/v1"
        echo ""
        read -p "Press Enter to open Vercel..."
        if command -v xdg-open &> /dev/null; then
            xdg-open https://vercel.com
        elif command -v open &> /dev/null; then
            open https://vercel.com
        else
            echo "Open https://vercel.com in your browser"
        fi
        ;;

    2)
        echo ""
        echo "============================================"
        echo "🚀 Deploying Backend to Railway (FREE)"
        echo "============================================"
        echo ""
        echo "Steps:"
        echo "1. Go to https://railway.app"
        echo "2. Sign up with GitHub"
        echo "3. Click 'New Project'"
        echo "4. Select 'Deploy from GitHub repo'"
        echo "5. Choose your repository"
        echo "6. Set Root Directory: backend"
        echo ""
        echo "Environment Variables to add:"
        echo ""
        echo "  NODE_ENV=production"
        echo "  PORT=3001"
        echo "  DB_CLIENT=pg"
        echo "  DB_HOST=your-neon-host"
        echo "  DB_USER=your-neon-user"
        echo "  DB_PASSWORD=your-neon-password"
        echo "  DB_NAME=flour_power_hub"
        echo "  DATABASE_URL=postgres://..."
        echo "  JWT_SECRET=your-super-secret-key-min-32-chars"
        echo "  JWT_EXPIRES_IN=7d"
        echo "  CORS_ORIGIN=https://your-vercel-app.vercel.app"
        echo "  ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:5173"
        echo ""
        read -p "Press Enter to open Railway..."
        if command -v xdg-open &> /dev/null; then
            xdg-open https://railway.app
        elif command -v open &> /dev/null; then
            open https://railway.app
        else
            echo "Open https://railway.app in your browser"
        fi
        ;;

    3)
        echo ""
        echo "============================================"
        echo "🚀 Setting Up Database on Neon (FREE)"
        echo "============================================"
        echo ""
        echo "Steps:"
        echo "1. Go to https://neon.tech"
        echo "2. Sign up with GitHub"
        echo "3. Click 'Create Project'"
        echo "4. Configure:"
        echo "     Name: flour-power-hub"
        echo "     Database: flour_power_hub"
        echo "5. Copy the connection string"
        echo "6. Add to Railway as DATABASE_URL"
        echo ""
        echo "Connection format:"
        echo "  postgres://user:password@ep-xxx.us-east-1.aws.neon.tech/flour_power_hub?sslmode=require"
        echo ""
        read -p "Press Enter to open Neon..."
        if command -v xdg-open &> /dev/null; then
            xdg-open https://neon.tech
        elif command -v open &> /dev/null; then
            open https://neon.tech
        else
            echo "Open https://neon.tech in your browser"
        fi
        ;;

    4)
        echo ""
        echo "============================================"
        echo "🚀 Quick Deploy All (Interactive)"
        echo "============================================"
        echo ""
        
        print_status "Step 1: Building frontend..."
        npm run build
        if [ $? -eq 0 ]; then
            print_success "Frontend built successfully"
        else
            print_error "Frontend build failed"
            exit 1
        fi
        
        echo ""
        print_status "Step 2: Build verification..."
        if [ -d "dist" ]; then
            print_success "Build output exists in /dist"
            ls -la dist/
        else
            print_error "Build output not found"
            exit 1
        fi
        
        echo ""
        print_status "Step 3: Git status..."
        git status
        
        echo ""
        print_success "✅ Pre-deployment checks passed!"
        echo ""
        echo "📋 Next steps:"
        echo "   1. Push to GitHub: git push origin main"
        echo "   2. Deploy frontend at https://vercel.com"
        echo "   3. Deploy backend at https://railway.app"
        echo "   4. Setup database at https://neon.tech"
        echo ""
        echo "📖 Full guide: See FREE_DEPLOYMENT.md"
        ;;

    5)
        echo ""
        cat FREE_DEPLOYMENT.md
        ;;

    6)
        echo ""
        print_success "Exiting. Happy deploying! 🎉"
        exit 0
        ;;

    *)
        echo ""
        print_error "Invalid option. Please choose 1-6."
        exit 1
        ;;
esac

echo ""
echo "============================================"
print_success "Deployment guide complete!"
echo "============================================"
echo ""
echo "📖 For detailed instructions, see: FREE_DEPLOYMENT.md"
echo "🔗 Quick links:"
echo "   - Vercel: https://vercel.com"
echo "   - Railway: https://railway.app"
echo "   - Neon: https://neon.tech"
echo ""

