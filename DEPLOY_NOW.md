# 🚀 Quick Deploy Guide

## Your Configuration
- **Account:** 202533497839
- **Region:** ap-south-1 (Mumbai)
- **Status:** ✅ Ready to Deploy

## Deploy in 5 Steps

### 1️⃣ Create .env Files (30 seconds)
```powershell
cd backend
copy .env.example .env
cd ../frontend
copy .env.example .env
cd ..
```

### 2️⃣ Bootstrap CDK (2 minutes, first time only)
```powershell
cd infrastructure
cdk bootstrap aws://202533497839/ap-south-1
```

### 3️⃣ Build Backend (1 minute)
```powershell
cd ../backend
npm run build
```

### 4️⃣ Deploy to AWS (5-10 minutes)
```powershell
cd ../infrastructure
cdk deploy --require-approval never
```

**⚠️ IMPORTANT:** Copy the outputs that appear after deployment!

### 5️⃣ Update Frontend Config (1 minute)
Edit `frontend/.env` with the CDK outputs:
```bash
VITE_API_URL=<paste ApiUrl>
VITE_AWS_USER_POOL_ID=<paste UserPoolId>
VITE_AWS_USER_POOL_CLIENT_ID=<paste UserPoolClientId>
```

## Create Test User
```powershell
aws cognito-idp admin-create-user --user-pool-id <YOUR_POOL_ID> --username demo@invoisaic.com --user-attributes Name=email,Value=demo@invoisaic.com Name=email_verified,Value=true --temporary-password TempPass123! --message-action SUPPRESS --region ap-south-1

aws cognito-idp admin-set-user-password --user-pool-id <YOUR_POOL_ID> --username demo@invoisaic.com --password Demo123! --permanent --region ap-south-1
```

## Start Application
```powershell
cd frontend
npm run dev
```

Open: **http://localhost:3000**

Login:
- Email: demo@invoisaic.com
- Password: Demo123!

---

## One-Line Deploy (After .env files created)

```powershell
cd backend && npm run build && cd ../infrastructure && cdk deploy --require-approval never
```

## Troubleshooting

**CDK Bootstrap Error?**
```powershell
aws configure
aws sts get-caller-identity
```

**Build Error?**
```powershell
cd backend && npm install && npm run build
```

**Deployment Error?**
- Check AWS credentials
- Verify Bedrock access in ap-south-1
- Ensure CDK is installed: `npm install -g aws-cdk`

---

**Total Time:** ~15 minutes from start to running app! ⚡
