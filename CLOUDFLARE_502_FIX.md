# 🔧 Fix 502 Bad Gateway Error

## Problem
Cloudflare Tunnel is running but can't connect to `http://localhost:8081`

## 🔍 Diagnosis Steps

### 1. Check if your local service is running
```bash
# Test if something is listening on port 8081
curl -v http://localhost:8081

# Or check ports
netstat -tlnp | grep 8081
# or
ss -tlnp | grep 8081
```

### 2. Check if cloudflared tunnel is running
```bash
# Check running processes
ps aux | grep cloudflared

# Check tunnel status
cloudflared tunnel list
```

### 3. Check tunnel logs
```bash
# View tunnel logs
journalctl -u cloudflared -f

# Or if running manually, check output
```

## 🚨 Common Causes & Solutions

### Cause 1: Nothing running on port 8081

**Solution:** Start your application
```bash
# If using Vite development server
npm run dev

# Or if using production build
npm run build
npm run preview

# Or start the backend separately
cd backend && npm run dev
```

### Cause 2: Wrong port in config.yml

**Solution:** Update `/home/mwei/flour-power-hub/config.yml` to match your actual service port

If your app runs on port 5173 (Vite default):
```yaml
ingress:
  - hostname: amani.mwei.co.ke
    service: http://localhost:5173
```

If your backend runs on port 3001:
```yaml
ingress:
  - hostname: api.amani.mwei.co.ke
    service: http://localhost:3001
```

### Cause 3: Service not binding to localhost

**Solution:** Ensure your service listens on `127.0.0.1` or `0.0.0.0`

For Vite:
```bash
npm run dev -- --host 0.0.0.0
```

### Cause 4: Firewall blocking localhost

**Solution:** Check firewall
```bash
# Allow localhost connections
sudo ufw allow from 127.0.0.1
sudo ufw allow 8081
```

## 📋 Updated config.yml Template

```yaml
tunnel: 8173c8e1-bc06-4f20-8aa8-a1f656f1afd4
credentials-file: /home/mwei/.cloudflared/8173c8e1-bc06-4f20-8aa8-a1f656f1afd4.json

ingress:
  # Main frontend app
  - hostname: amani.mwei.co.ke
    service: http://localhost:5173  # Adjust to your actual port
    originRequest:
      noTLSVerify: false
      connectTimeout: 10s
      tlsTimeout: 10s

  # API backend
  - hostname: api.amani.mwei.co.ke
    service: http://localhost:3001
    originRequest:
      noTLSVerify: false

  - service: http_status:404
```

## ✅ Testing Checklist

```bash
# 1. Test local service
curl http://localhost:8081

# 2. Test from network interface
curl http://127.0.0.1:8081

# 3. Check what port your app is using
netstat -tlnp | grep -E "(node|vite)"

# 4. Verify tunnel config
cloudflared tunnel --config /home/mwei/flour-power-hub/config.yml info

# 5. Test with verbose output
cloudflared tunnel --config /home/mwei/flour-power-hub/config.yml run --loglevel debug
```

## 🎯 Quick Fix Commands

If your app runs on port 5173 (Vite default):
```bash
# Update config
sed -i 's|service: http://localhost:8081|service: http://localhost:5173|' /home/mwei/flour-power-hub/config.yml

# Restart tunnel
pkill cloudflared
cloudflared tunnel --config /home/mwei/flour-power-hub/config.yml run &
```

If your app runs on port 3001 (Backend):
```bash
# Update config
sed -i 's|service: http://localhost:8081|service: http://localhost:3001|' /home/mwei/flour-power-hub/config.yml

# Restart tunnel
pkill cloudflared
cloudflared tunnel --config /home/mwei/flour-power-hub/config.yml run &
```

## 📊 Port Detection

Find what port your application uses:

```bash
# Frontend (Vite typically uses 5173)
lsof -i :5173

# Backend (Express typically uses 3001)
lsof -i :3001

# All Node processes
ps aux | grep node
```

## 🔄 Restart Everything

```bash
# Stop cloudflared
pkill cloudflared

# Start your application
npm run dev

# Start cloudflared (in background)
nohup cloudflared tunnel --config /home/mwei/flour-power-hub/config.yml run > /home/mwei/flour-power-hub/cloudflared.log 2>&1 &

# Test
curl -I https://amani.mwei.co.ke
```

## 📞 Expected Results

After fixes, you should see:
```
HTTP/2 200 OK
```

