# SSL/TLS Fix - COMPLETED ✅

## Original Issue
```bash
curl -v https://api.amani.mwei.co.ke/api/v1/auth/login
# TLS handshake failure: error:0A000410:SSL routines::ssl/tls alert handshake failure
```

## Root Cause
1. **SSL Certificate**: Wildcard certificate `*.mwei.co.ke` only covers `amani.mwei.co.ke`, NOT `api.amani.mwei.co.ke` (2nd-level subdomain)
2. **Backend route missing**: The `/api/v1/*` endpoints weren't properly defined

## Solution Implemented
Use path-based routing on the main domain (`amani.mwei.co.ke/api/v1/*`)

---

## 🚀 Starting Services After Restart

### Option 1: Quick Start Script (Recommended)
```bash
cd /home/mwei/flour-power-hub
./start-services.sh
```

This script will:
1. Check PostgreSQL
2. Start the Backend API on port 3001
3. Start the Cloudflare Tunnel
4. Verify everything is working

### Option 2: Manual Startup
```bash
# Terminal 1: Start Backend
cd /home/mwei/flour-power-hub/backend
nohup npx tsx src/app.ts > /tmp/backend.log 2>&1 &

# Terminal 2: Start Cloudflare Tunnel
sudo cloudflared --config /etc/cloudflared/config.yml tunnel run &
```

### Option 3: Systemd Service (Advanced)
```bash
# Install the service
sudo cp /home/mwei/flour-power-hub/backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable backend
sudo systemctl start backend

# Check status
sudo systemctl status backend
```

---

## 📝 Useful Commands

| Action | Command |
|--------|---------|
| Start all services | `./start-services.sh` |
| View backend logs | `tail -f /tmp/backend.log` |
| Check tunnel status | `cloudflared tunnel list` |
| Stop all services | `pkill -f 'tsx' && sudo pkill cloudflared` |
| Test API | `curl https://amani.mwei.co.ke/api/v1/health` |
| Test login | `curl -X POST https://amani.mwei.co.ke/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}'` |

---

## 🔗 API Endpoints

| Endpoint | Local | Production |
|----------|-------|------------|
| Health | http://localhost:3001/health | https://amani.mwei.co.ke/api/v1/health |
| Login | http://localhost:3001/api/v1/auth/login | https://amani.mwei.co.ke/api/v1/auth/login |
| Customers | http://localhost:3001/api/v1/customers | https://amani.mwei.co.ke/api/v1/customers |
| Transactions | http://localhost:3001/api/v1/transactions | https://amani.mwei.co.ke/api/v1/transactions |

---

## ✅ Verification
```bash
# Health check
$ curl -s https://amani.mwei.co.ke/api/v1/health
{"status":"ok","timestamp":"...","version":"v1","database":{"status":"healthy"}}

# Login (should return "Invalid credentials" for test user)
$ curl -X POST https://amani.mwei.co.ke/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
{"success":false,"error":"Invalid credentials"}
```

---

## 📂 Files Created/Modified

| File | Purpose |
|------|---------|
| `/home/mwei/flour-power-hub/start-services.sh` | Quick start script |
| `/home/mwei/flour-power-hub/backend.service` | Systemd service file |
| `/etc/cloudflared/config.yml` | Cloudflare Tunnel config |
| `/home/mwei/flour-power-hub/backend/src/app.ts` | Backend with `/api/v1/*` routes |

