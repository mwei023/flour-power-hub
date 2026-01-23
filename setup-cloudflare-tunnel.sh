#!/bin/bash

# Cloudflare Tunnel Setup Script for Flour Power Hub
# This script automates the installation and configuration of cloudflared

set -e  # Exit on error

echo "🚀 Cloudflare Tunnel Setup for Flour Power Hub"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_warning "This script works best with sudo privileges"
    echo ""
fi

# Step 1: Check if cloudflared is installed
echo "📦 Step 1: Checking cloudflared installation..."
if command -v cloudflared &> /dev/null; then
    print_status "cloudflared is already installed: $(cloudflared --version)"
    CLOUDFLARED_PATH=$(which cloudflared)
else
    print_warning "cloudflared not found. Installing..."
    
    # Detect architecture
    ARCH=$(uname -m)
    if [ "$ARCH" = "x86_64" ]; then
        CLOUDFARED_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
    elif [ "$ARCH" = "aarch64" ]; then
        CLOUDFARED_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
    else
        print_error "Unsupported architecture: $ARCH"
        exit 1
    fi
    
    # Download and install
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    wget -q "$CLOUDFARED_URL" -O cloudflared
    chmod +x cloudflared
    
    if [ "$EUID" -eq 0 ]; then
        sudo mv cloudflared /usr/local/bin/
    else
        mkdir -p "$HOME/.local/bin"
        mv cloudflared "$HOME/.local/bin/"
        export PATH="$HOME/.local/bin:$PATH"
    fi
    
    cd -
    rm -rf "$TEMP_DIR"
    
    print_status "cloudflared installed successfully"
    CLOUDFLARED_PATH=$(which cloudflared)
fi

echo ""

# Step 2: Create required directories
echo "📁 Step 2: Creating required directories..."
mkdir -p /home/mwei/flour-power-hub/cloudflared/creds
mkdir -p /home/mwei/flour-power-hub/cloudflared/logs
print_status "Directories created"

echo ""

# Step 3: Authenticate with Cloudflare
echo "🔐 Step 3: Cloudflare Authentication"
echo "You will need to authenticate with Cloudflare Zero Trust."
echo "A browser window will open for login."
echo ""

read -p "Do you want to authenticate now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd /home/mwei/flour-power-hub
    cloudflared tunnel login
    print_status "Authentication complete"
else
    print_warning "Skipping authentication for now"
    echo "Run 'cloudflared tunnel login' when ready"
fi

echo ""

# Step 4: Create tunnel
echo "🏗️ Step 4: Creating Cloudflare Tunnel..."
read -p "Enter a name for your tunnel (or press Enter for default): " TUNNEL_NAME
TUNNEL_NAME=${TUNNEL_NAME:-flour-power-hub-tunnel}

cd /home/mwei/flour-power-hub
TUNNEL_UUID=$(cloudflared tunnel create "$TUNNEL_NAME" 2>&1 | grep -oP 'UUID:\s*\K[^ ]+' || echo "")

if [ -z "$TUNNEL_UUID" ]; then
    print_warning "Tunnel creation may have failed or already exists"
    echo "Run 'cloudflared tunnel list' to check existing tunnels"
else
    print_status "Tunnel created with UUID: $TUNNEL_UUID"
fi

echo ""

# Step 5: Route DNS
echo "🌐 Step 5: Configuring DNS..."
read -p "Enter your domain (e.g., amani.mwei.co.ke): " DOMAIN
DOMAIN=${DOMAIN:-amani.mwei.co.ke}

cloudflared tunnel route dns "$TUNNEL_NAME" "$DOMAIN"
print_status "DNS routed to $DOMAIN"

echo ""

# Step 6: Update config.yml
echo "📝 Step 6: Updating configuration..."
TUNNEL_UUID_ACTUAL=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}' || echo "")

if [ -n "$TUNNEL_UUID_ACTUAL" ]; then
    # Update the config.yml with the actual tunnel UUID
    sed -i "s/tunnel: flour-power-hub-tunnel/tunnel: $TUNNEL_UUID_ACTUAL/" /home/mwei/flour-power-hub/config.yml
    print_status "Configuration updated with tunnel UUID"
else
    print_warning "Could not find tunnel UUID. You may need to manually update config.yml"
fi

echo ""

# Step 7: Create systemd service
echo "⚙️ Step 7: Creating systemd service..."
SERVICE_FILE="/etc/systemd/system/cloudflared-tunnel.service"

if [ -f "$SERVICE_FILE" ]; then
    print_warning "Service file already exists at $SERVICE_FILE"
else
    sudo tee "$SERVICE_FILE" > /dev/null << 'EOF'
[Unit]
Description=Cloudflare Tunnel for Flour Power Hub
After=network.target

[Service]
Type=simple
User=www-data
ExecStart=/usr/local/bin/cloudflared tunnel --config /home/mwei/flour-power-hub/config.yml run
Restart=always
RestartSec=5
Environment="TUNNEL_LOGLEVEL=info"

[Install]
WantedBy=multi-user.target
EOF
    print_status "Systemd service created at $SERVICE_FILE"
fi

echo ""

# Step 8: Summary
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Start the tunnel:"
echo "   cloudflared tunnel --config /home/mwei/flour-power-hub/config.yml run"
echo ""
echo "2. Or start as a service:"
echo "   sudo systemctl enable cloudflared-tunnel"
echo "   sudo systemctl start cloudflared-tunnel"
echo ""
echo "3. Check status:"
echo "   cloudflared tunnel list"
echo "   cloudflared tunnel info $TUNNEL_NAME"
echo ""
echo "4. Test your domain:"
echo "   curl -I https://$DOMAIN"
echo ""
echo "Configuration files:"
echo "   - /home/mwei/flour-power-hub/config.yml"
echo "   - $SERVICE_FILE"
echo ""
print_status "Good luck! 🚀"

