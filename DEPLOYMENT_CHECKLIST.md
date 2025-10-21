# 🚀 Deployment Checklist - Invoisaic

## ✅ Pre-Deployment Verification

### **1. Clerk Authentication**
- [x] Clerk keys added to `.env.example`
- [x] Clerk keys added to `.env.production`
- [x] ClerkProvider wrapping app in `main.tsx`
- [x] Navbar using Clerk components
- [x] Protected routes implemented
- [x] `@clerk/clerk-react` package installed (v5.53.2)

### **2. Environment Variables**
Ensure these are set in Vercel:
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2xvc2luZy1raXQtODcuY2xlcmsuYWNjb3VudHMuZGV2JA
VITE_CLERK_FRONTEND_API=https://closing-kit-87.clerk.accounts.dev
VITE_CLERK_JWKS_URL=https://closing-kit-87.clerk.accounts.dev/.well-known/jwks.json
```

### **3. Routing Configuration**
- [x] `vercel.json` configured for SPA routing
- [x] All routes rewrite to `/index.html`
- [x] Security headers added
- [x] Direct URLs will work (e.g., `/demo/livedoc`)

### **4. Protected Routes**
- [x] `/demo` - Requires authentication
- [x] `/demo/ecommerce` - Requires authentication
- [x] `/demo/ocr` - Requires authentication
- [x] `/demo/onboarding` - Requires authentication
- [x] `/demo/agents` - Requires authentication
- [x] `/demo/livedoc` - Requires authentication

### **5. Git Configuration**
- [x] `.gitignore` files recreated
- [x] `node_modules/` excluded
- [x] `.env*` files excluded
- [x] Build directories excluded

---

## 🚀 Deployment Steps

### **Option 1: Vercel CLI**
```bash
cd frontend
npm install
npm run build
vercel --prod
```

### **Option 2: GitHub Auto-Deploy**
```bash
git add .
git commit -m "feat: Add Clerk authentication with protected routes"
git push origin main
```
Vercel will automatically deploy.

---

## 🧪 Post-Deployment Testing

### **1. Direct URL Access**
Test these URLs work directly:
- [ ] `https://invoisaic.xyz/`
- [ ] `https://invoisaic.xyz/demo`
- [ ] `https://invoisaic.xyz/demo/livedoc`
- [ ] `https://invoisaic.xyz/demo/ecommerce`
- [ ] `https://invoisaic.xyz/architecture`

### **2. Authentication Flow**
- [ ] Click "Start Demo" button
- [ ] Clerk sign-in modal opens
- [ ] Sign up with email works
- [ ] Sign in with email works
- [ ] Social login works (if configured)
- [ ] Redirects to demo after auth
- [ ] User avatar shows in navbar
- [ ] Sign out works

### **3. Protected Routes**
- [ ] Accessing `/demo` without auth shows sign-in
- [ ] After sign-in, redirects to `/demo`
- [ ] Can navigate between demos freely
- [ ] Session persists on page refresh

### **4. Page Refresh**
- [ ] Refresh on `/demo` works
- [ ] Refresh on `/demo/livedoc` works
- [ ] No 404 errors on refresh
- [ ] Authentication state persists

---

## 🔧 Vercel Dashboard Configuration

### **1. Environment Variables**
Go to: **Project Settings** → **Environment Variables**

Add these for **Production**, **Preview**, and **Development**:
```
VITE_CLERK_PUBLISHABLE_KEY
VITE_CLERK_FRONTEND_API
VITE_CLERK_JWKS_URL
VITE_AWS_REGION
VITE_AWS_USER_POOL_ID
VITE_AWS_USER_POOL_CLIENT_ID
VITE_API_URL
VITE_S3_BUCKET
```

### **2. Build Settings**
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### **3. Domain Settings**
- **Production Domain:** `invoisaic.xyz`
- **SSL:** Enabled (automatic)
- **HTTPS:** Force redirect

---

## 🎯 Clerk Dashboard Configuration

### **1. Application Settings**
- **Name:** Invoisaic
- **Environment:** Production
- **Domain:** `https://invoisaic.xyz`

### **2. Social Connections** (Optional)
Enable these providers:
- [ ] Google
- [ ] GitHub
- [ ] Microsoft
- [ ] LinkedIn
- [ ] Discord

### **3. Appearance**
Customize sign-in/sign-up modals:
- [ ] Logo uploaded
- [ ] Brand colors set
- [ ] Theme matches app (dark/light)

### **4. Security**
- [ ] Email verification enabled
- [ ] Password requirements set
- [ ] Session timeout configured
- [ ] Rate limiting enabled

---

## 📊 Monitoring

### **1. Vercel Analytics**
- [ ] Enable Vercel Analytics
- [ ] Monitor page load times
- [ ] Track user navigation

### **2. Clerk Dashboard**
- [ ] Monitor sign-ups
- [ ] Track active sessions
- [ ] Review authentication logs

### **3. Error Tracking**
- [ ] Check Vercel deployment logs
- [ ] Monitor browser console errors
- [ ] Review Clerk error logs

---

## 🐛 Troubleshooting

### **Issue: Direct URLs return 404**
**Solution:** Verify `vercel.json` has rewrite rule
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### **Issue: Clerk modal not opening**
**Solution:** Check environment variables in Vercel
- Verify `VITE_CLERK_PUBLISHABLE_KEY` is set
- Ensure key starts with `pk_test_` or `pk_live_`
- Redeploy after adding variables

### **Issue: Authentication not persisting**
**Solution:** Check Clerk session settings
- Verify domain matches in Clerk Dashboard
- Check cookie settings
- Ensure HTTPS is enabled

### **Issue: Social login not working**
**Solution:** Configure OAuth apps
- Add OAuth credentials in Clerk Dashboard
- Verify redirect URLs match
- Test each provider individually

---

## ✅ Final Checklist

Before going live:
- [ ] All environment variables set in Vercel
- [ ] Build succeeds without errors
- [ ] All routes accessible
- [ ] Authentication flow works
- [ ] Direct URLs work
- [ ] Page refresh works
- [ ] Mobile responsive
- [ ] Dark/light theme works
- [ ] Social logins configured (optional)
- [ ] Error tracking enabled
- [ ] Analytics enabled
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] DNS records updated

---

## 🎉 Ready to Launch!

Once all items are checked:
1. Deploy to production
2. Test all functionality
3. Monitor for issues
4. Celebrate! 🎊

---

## 📞 Support

- **Vercel:** [https://vercel.com/support](https://vercel.com/support)
- **Clerk:** [https://clerk.com/support](https://clerk.com/support)
- **Documentation:** See `CLERK_IMPLEMENTATION_COMPLETE.md`
