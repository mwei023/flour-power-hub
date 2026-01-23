# Cloudflare Tunnel Setup Guide for Flour Power Hub

This guide will help you configure Cloudflare Tunnel to expose your local application (`amani.mwei.co.ke` → `http://localhost:8081`) to the internet.

## Overview

You want to:
- Domain: `amani.mwei.co.ke`
- Local Service: `http://localhost:8081`
- Method: Cloudflare Tunnel (cloudflared)

## Prerequisites

1. **Cloudflare Account** with a domain registered
2. **Cloudflare Zero Trust** (free tier available) 
3. **cloudflared** installed on your server

## Step 1: Install cloudflared

### On Linux/Docker:
```bash
# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Verify installation
cloudflared --version
```

### Using Docker:
```bash
docker pull cloudflare/cloudflared:latest
```

## Step 2: Create Cloudflare Tunnel Configuration

Create the `config.yml` file that you mentioned:

```yaml
# /home/mwei/flour-power-hub/config.yml
# Cloudflare Tunnel Configuration

# Tunnel name (unique identifier for your tunnel)
tunnel: flour-power-hub-tunnel
# Random UUID string (generate with: uuidgen)
credentials-file: /etc/cloudflared/creds/creds.json

# Ingress rules - define how traffic should be routed
ingress:
  # Route API traffic to backend
  - hostname: api.amani.mwei.co.ke
    service: http://localhost:3001
  
  # Route main application to frontend
  - hostname: amani.mwei.co.ke
    service: http://localhost:8081
  
  # Catch-all rule (required)
  - service: http_status:404
```

### Alternative simplified config (if you only need one service):

```yaml
# Simple config.yml
tunnel: amani-mwei-tunnel
credentials-file: /etc/cloudflared/creds/creds.json

ingress:
  - hostname: amani.mwei.co.ke
    service: http://localhost:8081
  
  - service: http_status:404
```

## Step 3: Authenticate with Cloudflare

1. **Login to Cloudflare Zero Trust:**
   ```bash
   cloudflared tunnel login
   ```

2. This will open a browser window for authentication
3. Select your domain `amani.mwei.co.ke`
4. Authorize the application

## Step 4: Create and Configure the Tunnel

```bash
# Create the tunnel
cloudflared tunnel create flour-power-hub-tunnel

# Note the tunnel UUID returned (e.g., "a1b2c3d4-e5f6-7890-...")

# Route the tunnel to your domain
cloudflared tunnel route dns flour-power-hub-tunnel amani.mwei.co.ke
```

## Step 5: Create Systemd Service (for auto-start)

Create `/etc/systemd/system/cloudflared.service`:

```ini
[Unit]
Description=Cloudflare Tunnel for Flour Power Hub
After=network.target

[Service]
Type=simple
User=www-data
ExecStart=/usr/local/bin/cloudflared tunnel --config /home/mwei/flour-power-hub/config.yml run
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

## Step 6: Configure Your Application

### Backend Configuration
Update your backend to handle production requests:

1. **Environment variables:**
   ```bash
   # Add to your backend/.env
   NODE_ENV=production
   PORT=3001
   API_URL=https://amani.mwei.co.ke
   FRONTEND_URL=https://amani.mwei.co.ke
   ```

2. **CORS Configuration** in `backend/src/app.ts`:
   ```typescript
   const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') || [
     'http://localhost:5173',
     'http://localhost:3000',
     'https://amani.mwei.co.ke',  // Add your Cloudflare domain
   ];
   ```

### Frontend Configuration
Update `src/lib/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Set VITE_API_URL to your backend URL
// For local development: VITE_API_URL=http://localhost:3001/api
// For production: VITE_API_URL=https://amani.mwei.co.ke/api
```

## Step 7: Verify DNS Configuration

After running the tunnel route command, check your Cloudflare DNS:

1. Go to [cloudflare.com](https://cloudflare.com) → DNS → DNS Settings
2. You should see:
   ```
   Type: CNAME
   Name: amani
   Target: flour-power-hub-tunnel.<your-tunnel-id>.cfargotunnel.com
   TTL: Auto
   Proxy: Proxied (orange cloud)
   ```

## Step 8: Test Your Setup

1. **Start your local application:**
   ```bash
   # Start backend
   cd backend && npm run dev
   
   # Start frontend (if different port)
   npm run dev
   ```

2. **Start the tunnel:**
   ```bash
   cloudflared tunnel --config /home/mwei/flour-power-hub/config.yml run
   ```

3. **Test in browser:**
   - Visit: `https://amani.mwei.co.ke`
   - Should see your application running from localhost:8081

4. **Test API:**
   - `https://amani.mwei.co.ke/api/health`

## Troubleshooting

### Common Issues:

1. **"Tunnel not found" error:**
   ```bash
   # Check tunnel status
   cloudflared tunnel list
   
   # Verify credentials file exists
   cat /etc/cloudflared/creds/creds.json
   ```

2. **502 Bad Gateway:**
   - Check if your local service is running on the correct port
   - Verify firewall allows connections to localhost
   ```bash
   curl http://localhost:8081
   ```

3. **SSL Certificate Issues:**
   ```bash
   # Check tunnel logs
   journalctl -u cloudflared -f
   ```

4. **CORS Errors:**
   - Update CORS configuration in backend to allow your domain
   - Check browser console for specific CORS errors

### Check Logs:
```bash
# Systemd service logs
sudo journalctl -u cloudflared -f

# Or run directly for debugging
cloudflared tunnel --config /home/mwei/flour-power-hub/config.yml run --loglevel debug
```

## Docker Deployment (Alternative)

Create `docker-compose.cloudflare.yml`:

```yaml
version: '3.8'

services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared-tunnel
    restart: unless-stopped
    command: tunnel --config /etc/cloudflared/config.yml run
    volumes:
      - ./config.yml:/etc/cloudflared/config.yml:ro
      - ./creds:/etc/cloudflared/creds:ro
    networks:
      - app-network
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.production
    container_name: poshomill-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    networks:
      - app-network
    depends_on:
      - postgres

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: poshomill-frontend
    restart: unless-stopped
    ports:
      - "8081:80"  # Serve on port 8081
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## Security Considerations

1. **Use HTTPS:** Cloudflare provides free SSL
2. **Rate Limiting:** Configure in Cloudflare dashboard
3. **Firewall Rules:** Use Cloudflare WAF
4. **Authentication:** Consider adding Cloudflare Access for private apps

## Quick Reference Commands

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Login and create tunnel
cloudflared tunnel login
cloudflared tunnel create flour-power-hub-tunnel
cloudflared tunnel route dns flour-power-hub-tunnel amani.mwei.co.ke

# Run tunnel
cloudflared tunnel --config config.yml run

# Check status
cloudflared tunnel list
cloudflared tunnel info flour-power-hub-tunnel
```

## Next Steps

1. ✅ Install cloudflared
2. ✅ Create config.yml
3. ⬜ Authenticate with Cloudflare (`cloudflared tunnel login`)
4. ⬜ Create tunnel (`cloudflared tunnel create`)
5. ⬜ Route DNS (`cloudflared tunnel route dns`)
6. ⬜ Start tunnel and test

## Support

- Cloudflare Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps
- GitHub: https://github.com/cloudflare/cloudflared
- Community: https://community.cloudflare.com

---

**Note:** Your `config.yml` file has been created at `/home/mwei/flour-power-hub/config.yml`. Make sure to update it with your actual tunnel credentials and test the configuration.

