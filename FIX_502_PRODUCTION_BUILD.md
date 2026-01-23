# 502 Bad Gateway Fix - Production Build Plan

## Problem
Cloudflare tunnel points to `localhost:8081` but nothing is running there.

## Solution: Use Production Build on Port 8081

### Step 1: Build the frontend
```bash
npm run build
```

### Step 2: Start the preview server on port 8081
```bash
npm run preview -- --port 8081
```

### Step 3: Ensure backend is running on port 3001
```bash
cd backend && npm run dev
```

### Step 4: Verify tunnel is running
```bash
# Check tunnel status
cloudflared tunnel list

# Or restart tunnel if needed
cloudflared tunnel --config ~/.cloudflared/config.yml run &
```

### Step 5: Test the deployment
```bash
# Test frontend
curl -I https://amani.mwei.co.ke

# Test API
curl -I https://amani.mwei.co.ke/api/v1/health
```

## One-liner to start everything
```bash
# Build and preview
npm run build && npm run preview -- --port 8081 &

# In another terminal, start backend
cd backend && npm run dev &
```

## Background process setup
To keep services running in background:
```bash
# Start frontend preview (runs in background)
nohup npm run preview -- --port 8081 > frontend.log 2>&1 &

# Start backend (runs in background)
nohup cd backend && npm run dev > backend.log 2>&1 &

# Start cloudflare tunnel (runs in background)
nohup cloudflared tunnel --config ~/.cloudflared/config.yml run > tunnel.log 2>&1 &
```

## Verify Everything is Working
```bash
# Check processes
ps aux | grep -E "(node|cloudflared)" | grep -v grep

# Test endpoints
curl -s https://amani.mwei.co.ke | head -20
curl -s https://amani.mwei.co.ke/api/v1/health
```

