# 🚀 Quick Start: Cloudflare Tunnel for Flour Power Hub

## Your Current Setup
- **Domain:** `amani.mwei.co.ke`
- **Local Service:** `http://localhost:8081`
- **Goal:** Expose local app to internet via Cloudflare Tunnel

## Files Created
✅ `/home/mwei/flour-power-hub/config.yml` - Cloudflare Tunnel configuration
✅ `/home/mwei/flour-power-hub/setup-cloudflare-tunnel.sh` - Automated setup script
✅ `/home/mwei/flour-power-hub/CLOUDFLARE_TUNNEL_SETUP.md` - Detailed guide

## ⚡ Quick Start (3 Steps)

### Step 1: Install cloudflared
```bash
# Quick install
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Verify
cloudflared --version
```

### Step 2: Authenticate & Create Tunnel
```bash
# Login to Cloudflare (opens browser)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create flour-power-hub-tunnel

# Route your domain to the tunnel
cloudflared tunnel route dns flour-power-hub-tunnel amani.mwei.co.ke
```

### Step 3: Start the Tunnel
```bash
# Run the tunnel
cloudflared tunnel --config /home/mwei/flour-power-hub/config.yml run

# Or use the setup script for guided installation
bash /home/mwei/flour-power-hub/setup-cloudflare-tunnel.sh
```

## ✅ Verify It Works

1. **Check tunnel status:**
   ```bash
   cloudflared tunnel list
   ```

2. **Test your domain:**
   ```bash
   curl -I https://amani.mwei.co.ke
   # Should return: HTTP/2 200 OK
   ```

3. **Open in browser:**
   ```
   https://amani.mwei.co.ke
   ```

## 🔧 Application Configuration

### Backend (Already Configured ✅)
Your backend is configured to handle production requests. Make sure these environment variables are set:

```bash
# In backend/.env
NODE_ENV=production
PORT=3001
API_URL=https://amani.mwei.co.ke
CORS_ORIGIN=https://amani.mwei.co.ke,http://localhost:5173
```

### Frontend (Already Configured ✅)
Your frontend is configured to use environment-based API URL:

```bash
# In .env or Vercel environment variables
VITE_API_URL=https://amani.mwei.co.ke/api
```

## 🐛 Troubleshooting

### "Tunnel not found"
```bash
# List all tunnels
cloudflared tunnel list

# If tunnel doesn't exist, create it:
cloudflared tunnel create flour-power-hub-tunnel
```

### "Connection refused" (502)
```bash
# Check if your app is running locally
curl http://localhost:8081

# If not running, start it:
npm run dev
```

### "SSL certificate error"
```bash
# Check tunnel logs
journalctl -u cloudflared -f

# Or run with debug
cloudflared tunnel --config /home/mwei/flour-power-hub/config.yml run --loglevel debug
```

### CORS errors
Update your backend CORS configuration to include your domain:

```typescript
// In backend/src/app.ts
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://amani.mwei.co.ke',  // Add this
];
```

## 📋 Common Commands

| Action | Command |
|--------|---------|
| Start tunnel | `cloudflared tunnel --config /home/mwei/flour-power-hub/config.yml run` |
| List tunnels | `cloudflared tunnel list` |
| Delete tunnel | `cloudflared tunnel delete flour-power-hub-tunnel` |
| Check DNS | `dig amani.mwei.co.ke` |
| View logs | `journalctl -u cloudflared -f` |
| Test health | `curl https://amani.mwei.co.ke/health` |

## 🔐 Security Checklist

- [ ] Use HTTPS only (Cloudflare provides free SSL)
- [ ] Enable Cloudflare WAF rules
- [ ] Set up rate limiting in Cloudflare dashboard
- [ ] Consider Cloudflare Access for admin routes
- [ ] Keep cloudflared updated (`cloudflared update`)

## 📞 Need Help?

1. **Check logs:** `journalctl -u cloudflared -f`
2. **Cloudflare Docs:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps
3. **Common Issues:** See `CLOUDFLARE_TUNNEL_SETUP.md`

---

**Happy Deploying! 🎉**
Your domain `amani.mwei.co.ke` will soon be accessible from anywhere!

