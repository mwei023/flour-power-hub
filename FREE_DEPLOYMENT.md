# FREE Deployment Plan for Flour Power Hub

## 🚀 Quick Free Deployment (Recommended)

Since you have no money, here's the **best free stack**:

| Component | Service | Cost | Link |
|-----------|---------|------|------|
| **Frontend (PWA)** | Vercel | Free | vercel.com |
| **Backend API** | Railway | Free ($5/mo credit) | railway.app |
| **Database** | Neon (PostgreSQL) | Free (500MB) | neon.tech |

### Alternative Options:
- **Frontend**: Netlify, Cloudflare Pages (also free)
- **Backend**: Render, Fly.io, Cyclic
- **Database**: Supabase, Railway (PostgreSQL add-on)

---

## 📋 Step-by-Step Deployment Guide

### Step 1: Prepare Your Code

First, push your code to GitHub if you haven't already:

```bash
git init (if not already initialized)
git add .
git commit -m "Prepare for deployment"
# Create a repository on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/flour-power-hub.git
git push -u origin main
```

### Step 2: Deploy Frontend to Vercel (FREE)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "Add New Project" → Import your `flour-power-hub` repository
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```
5. Click "Deploy"

**Frontend URL**: `https://flour-power-hub.vercel.app` (or your custom domain)

### Step 3: Deploy Backend to Railway (FREE)

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `flour-power-hub` repository
4. Configure the service:
   - **Root Directory**: `backend`
5. Add Environment Variables in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=3001
   DB_CLIENT=pg
   DB_HOST=YOUR_NEON_HOST
   DB_USER=YOUR_NEON_USER
   DB_PASSWORD=YOUR_NEON_PASSWORD
   DB_NAME=flour_power_hub
   JWT_SECRET=your-super-secure-random-string-at-least-32-chars
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```
6. Click "Deploy"

**Backend URL**: `https://your-backend-production.up.railway.app`

### Step 4: Set Up Database with Neon (FREE)

1. Go to [neon.tech](https://neon.tech) and sign up with GitHub
2. Click "Create Project":
   - **Name**: flour-power-hub
   - **Database**: flour_power_hub
3. Copy the connection string from the dashboard:
   ```
   postgres://user:password@ep-xxx.us-east-1.aws.neon.tech/flour_power_hub?sslmode=require
   ```
4. Add this to Railway environment variables as `DATABASE_URL`

### Step 5: Run Database Migrations

1. In Railway, go to your backend service
2. Click "New" → "Magic" or "Railway CLI"
3. Or use the terminal in Railway:
   ```bash
   npx knex migrate:latest
   ```

### Step 6: Update Frontend API URL

1. In Vercel dashboard, update:
   ```
   VITE_API_URL=https://your-backend-production.up.railway.app/api
   ```

### Step 7: Test Your Deployment

- Frontend: `https://flour-power-hub.vercel.app`
- Backend API: `https://your-backend.railway.app/api`
- API Health: `https://your-backend.railway.app/api/health`

---

## 🔧 Configuration Changes Needed

### Update CORS for Production

Edit `backend/src/middleware/security.ts` or create environment-based CORS:

```typescript
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000',
    // Add your Vercel frontend URL here
  ],
  credentials: true,
};
```

### Update API Base URL in Frontend

Edit `src/lib/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

Make sure to set `VITE_API_URL` in Vercel environment variables.

---

## 🎯 Quick Deploy Commands

### Build Frontend Locally

```bash
npm run build
# Output is in /dist folder
```

### Deploy Frontend via CLI (Optional)

```bash
npm i -g vercel
vercel --prod
```

---

## 📊 Free Tier Limits

| Service | Free Limit | Notes |
|---------|-----------|-------|
| **Vercel** | 100GB bandwidth/month | More than enough for small business |
| **Railway** | 500 hours/month | Backend sleeps after 15 min inactivity |
| **Neon** | 500MB storage | 10 branches, auto-suspend after 7 days |

---

## 🔒 Security Checklist

- [ ] Use strong `JWT_SECRET` (32+ random characters)
- [ ] Enable SSL (automatic on Vercel/Railway/Neon)
- [ ] Set `NODE_ENV=production`
- [ ] Use environment variables for all secrets
- [ ] CORS restricted to your frontend domain only

---

## 🚨 Troubleshooting

### Backend Not Responding
- Check Railway logs in dashboard
- Ensure all environment variables are set
- Verify Neon database is active (may suspend after 7 days)

### CORS Errors
- Add frontend URL to `CORS_ORIGIN` env var in Railway
- Format: `https://your-project.vercel.app,http://localhost:5173`

### Database Connection Failed
- Verify `DATABASE_URL` format in Railway
- Ensure Neon project is active (not suspended)
- Check SSL requirement: `?sslmode=require`

---

## 💰 Estimated Monthly Cost

**$0.00** - Everything is free!

- Vercel: Free (Personal plan)
- Railway: Free ($5 credit/month)
- Neon: Free (10 branches, 500MB)

---

## 📱 PWA Features

Your app is already configured as a PWA with:
- ✅ Installable on mobile/desktop
- ✅ Offline support (Service Worker)
- ✅ App icons configured
- ✅ Push notifications ready

Once deployed, users can install it as a native app!

---

## 🔄 Future: CI/CD (Bonus)

Your `.github/workflows/ci-cd.yml` is already set up. To use it:

1. Add GitHub Secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `RAILWAY_TOKEN` (optional)

2. Push to main → Automatic deployment!

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel frontend deployed
- [ ] Neon database created
- [ ] Railway backend deployed
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] CORS configured
- [ ] Frontend API URL updated
- [ ] App tested at live URLs
- [ ] PWA installed on device

---

**Questions?** Check `PRODUCTION_DEPLOYMENT.md` for more details or open an issue on GitHub.

**Happy Deploying! 🎉**

