# SSL/TLS Handshake Fix - COMPLETED ✅

## Original Issue
- DNS resolved for `api.amani.mwei.co.ke` but TLS handshake failed with `error:0A000410:SSL routines::ssl/tls alert handshake failure`

## Root Cause
1. The `api.amani.mwei.co.ke` subdomain DNS was routed to `mwei-tunnel`
2. The config in `/home/mwei/flour-power-hub/config.yml` used a different tunnel (`flour-power-hub-tunnel`)
3. SSL certificate was not properly configured for the subdomain

## Solution Implemented

### 1. Updated Cloudflare Tunnel Config (`~/.cloudflared/config.yml`)
- Changed to use the working `mwei-tunnel` (UUID: `00b60aa3-57d2-4fd9-9f3f-33192b4cad48`)
- Added path-based routing for API: `/api/*` → `localhost:3001`
- Kept main domain routing: `amani.mwei.co.ke` → `localhost:8081`

### 2. Updated Frontend API Config (`src/lib/api.ts`)
- Changed from `https://api.amani.mwei.co.ke/api/v1` to `https://amani.mwei.co.ke/api/v1`
- Uses path-based routing on main domain

### 3. Restarted Cloudflare Tunnel
- Tunnel now connected with 4 connections (jnb01, jnb04, cpt01)

## Verification
```bash
# TLS handshake now works
curl -s -X POST https://amani.mwei.co.ke/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
# Returns: {"success":false,"error":"Invalid credentials"} ✅

# Health check works
curl -I https://amani.mwei.co.ke/api/v1/health
# Returns: HTTP/2 200 ✅
```

## Files Modified
1. `/home/mwei/flour-power-hub/config.yml` - Updated tunnel config
2. `/home/mwei/.cloudflared/config.yml` - Added path-based API routing
3. `/home/mwei/flour-power-hub/src/lib/api.ts` - Updated API URL

## To Keep the Tunnel Running
```bash
# Start tunnel
cloudflared tunnel --config /home/mwei/.cloudflared/config.yml run &

# Or create systemd service (optional)
sudo tee /etc/systemd/system/cloudflared-tunnel.service > /dev/null << 'EOF'
[Unit]
Description=Cloudflare Tunnel for Flour Power Hub
After=network.target

[Service]
Type=simple
User=mwei
ExecStart=/usr/local/bin/cloudflared tunnel --config /home/mwei/.cloudflared/config.yml run
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable cloudflared-tunnel
sudo systemctl start cloudflared-tunnel
```

