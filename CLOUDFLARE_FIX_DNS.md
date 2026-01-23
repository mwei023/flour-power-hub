# 🔧 Fix Cloudflare Tunnel DNS Conflict

## Problem
You already have a DNS record for `amani.mwei.co.ke` that's conflicting with the tunnel.

## ✅ What You Achieved So Far
- ✅ Cloudflared installed and authenticated
- ✅ Tunnel created: `flour-power-hub-tunnel` (ID: `8173c8e1-bc06-4f20-8aa8-a1f656f1afd4`)
- ⚠️ DNS routing failed (record already exists)

## 🔨 Solution Options

### Option 1: Delete Existing DNS Record (Recommended)

1. **Go to Cloudflare Dashboard:**
   - Visit: https://dash.cloudflare.com
   - Select domain: `mwei.co.ke`
   - Go to: **DNS** → **DNS Records**

2. **Find and delete existing record:**
   - Look for `amani` or `amani.mwei.co.ke`
   - If it's an A record pointing to an IP, delete it
   - If it's a CNAME, delete it

3. **Then run:**
   ```bash
   cloudflared tunnel route dns flour-power-hub-tunnel amani.mwei.co.ke
   ```

### Option 2: Use a Different Subdomain

If you want to keep the existing DNS record, use a different subdomain:

```bash
# Route to www subdomain
cloudflared tunnel route dns flour-power-hub-tunnel www.amani.mwei.co.ke

# Or route to api subdomain
cloudflared tunnel route dns flour-power-hub-tunnel api.amani.mwei.co.ke
```

Then update your `config.yml`:
```yaml
ingress:
  - hostname: www.amani.mwei.co.ke  # or api.amani.mwei.co.ke
    service: http://localhost:8081
```

## 📝 Update Your config.yml

Your tunnel ID is: `8173c8e1-bc06-4f20-8aa8-a1f656f1afd4`

Update `/home/mwei/flour-power-hub/config.yml`:

```yaml
tunnel: 8173c8e1-bc06-4f20-8aa8-a1f656f1afd4
credentials-file: /home/mwei/.cloudflared/8173c8e1-bc06-4f20-8aa8-a1f656f1afd4.json

ingress:
  - hostname: amani.mwei.co.ke
    service: http://localhost:8081
    originRequest:
      noTLSVerify: false
      connectTimeout: 10s
      tlsTimeout: 10s

  - service: http_status:404
```

## 🚀 Start the Tunnel

Once DNS is fixed:

```bash
# Run the tunnel
cloudflared tunnel --config /home/mwei/flour-power-hub/config.yml run

# Or run in background with logging
nohup cloudflared tunnel --config /home/mwei/flour-power-hub/config.yml run > /home/mwei/flour-power-hub/cloudflared.log 2>&1 &
```

## ✅ Verify Setup

```bash
# Check tunnel status
cloudflared tunnel list

# Test your domain
curl -I https://amani.mwei.co.ke
```

## 📋 Complete Commands Summary

```bash
# 1. Delete existing DNS record in Cloudflare dashboard
# Then:

# 2. Route DNS
cloudflared tunnel route dns flour-power-hub-tunnel amani.mwei.co.ke

# 3. Update config with tunnel ID
# Edit /home/mwei/flour-power-hub/config.yml and set:
# tunnel: 8173c8e1-bc06-4f20-8aa8-a1f656f1afd4

# 4. Start tunnel
cloudflared tunnel --config /home/mwei/flour-power-hub/config.yml run

# 5. Test
curl -I https://amani.mwei.co.ke
```

## 🎯 Next Steps

1. Delete the conflicting DNS record in Cloudflare dashboard
2. Run the DNS route command
3. Start the tunnel
4. Test your domain

Your tunnel is ready to go! 🎉

