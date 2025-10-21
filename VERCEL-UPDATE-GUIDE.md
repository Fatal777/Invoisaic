# 🚀 Vercel Update Guide - New Repository

## Option 1: Update Existing Project (Recommended)

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Click on your **Invoisaic** project

### Step 2: Update Git Repository
1. Go to **Settings** tab
2. Scroll to **Git** section
3. Click **Disconnect** (to disconnect old repository)
4. Click **Connect Git Repository**
5. Select **GitHub**
6. Choose repository: `Fatal777/Invoisaic`
7. Click **Connect**

### Step 3: Configure Build Settings
Make sure these settings are correct:

**Framework Preset:** `Vite`

**Root Directory:** `frontend`

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```bash
dist
```

**Install Command:**
```bash
npm install
```

### Step 4: Environment Variables
Verify all environment variables are still set:

Go to **Settings** → **Environment Variables**

Required variables:
- `VITE_CLERK_PUBLISHABLE_KEY` (Live key: `pk_live_...`)
- `VITE_API_URL`
- `VITE_WEBSOCKET_URL`
- `VITE_AWS_REGION`
- `VITE_AWS_USER_POOL_ID`
- `VITE_AWS_USER_POOL_CLIENT_ID`
- `VITE_S3_BUCKET`

### Step 5: Redeploy
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger auto-deployment

---

## Option 2: Create New Project (If Option 1 Fails)

### Step 1: Create New Project
1. Go to: https://vercel.com/new
2. Click **Import Git Repository**
3. Select `Fatal777/Invoisaic`
4. Click **Import**

### Step 2: Configure Project
**Project Name:** `invoisaic` (or your preferred name)

**Framework Preset:** `Vite`

**Root Directory:** `frontend`

**Build Settings:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Step 3: Add Environment Variables
Click **Add** for each variable:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
VITE_API_URL=https://xpdhtqhxfa.execute-api.ap-south-1.amazonaws.com/prod
VITE_WEBSOCKET_URL=wss://lbrbkmd3s0.execute-api.ap-south-1.amazonaws.com/prod
VITE_AWS_REGION=ap-south-1
VITE_AWS_USER_POOL_ID=ap-south-1_22ZdrSEVz
VITE_AWS_USER_POOL_CLIENT_ID=2dmut3kvpd2tefdrhjbpuls25t
VITE_S3_BUCKET=invoisaic-documents-dev-202533497839
```

### Step 4: Deploy
1. Click **Deploy**
2. Wait for build to complete
3. Visit your deployment URL

### Step 5: Update Domain (If you had a custom domain)
1. Go to **Settings** → **Domains**
2. Add your domain: `invoisaic.xyz`
3. Follow DNS configuration instructions

---

## Vercel CLI Method (Advanced)

If you have Vercel CLI installed:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link to existing project
cd frontend
vercel link

# Deploy
vercel --prod
```

---

## Troubleshooting

### Build Fails
1. Check **Build Logs** in Vercel dashboard
2. Verify `Root Directory` is set to `frontend`
3. Ensure all environment variables are set

### Environment Variables Not Working
1. Make sure variable names start with `VITE_`
2. Redeploy after adding variables
3. Check variable scope (Production/Preview/Development)

### Domain Not Working
1. Verify DNS settings in your domain registrar
2. Wait for DNS propagation (can take up to 48 hours)
3. Check Vercel domain settings

---

## Post-Deployment Checklist

- [ ] Site loads correctly
- [ ] Dark/Light mode toggle works
- [ ] New color scheme (Georgia Peach/Pastel Peach) is visible
- [ ] Clerk authentication works
- [ ] All demo pages load
- [ ] API calls work (check browser console)
- [ ] No .env files visible in repository

---

## Important Notes

⚠️ **Never commit `.env` files** - They're now in `.gitignore`

✅ **All environment variables** should be set in Vercel Dashboard

🔒 **Use LIVE Clerk keys** for production (starts with `pk_live_`)

🎨 **New color scheme** should be visible immediately

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support

---

**Last Updated:** October 21, 2025
