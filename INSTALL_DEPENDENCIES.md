# Install Dependencies - Fix All Errors

## Current Errors

The TypeScript errors you're seeing are because dependencies haven't been installed yet. Follow these steps to fix all errors:

## Step 1: Install Root Dependencies

```powershell
# In the root directory
npm install
```

## Step 2: Install Frontend Dependencies

```powershell
cd frontend
npm install
cd ..
```

## Step 3: Install Backend Dependencies

```powershell
cd backend
npm install
cd ..
```

## Step 4: Install Infrastructure Dependencies

```powershell
cd infrastructure
npm install
cd ..
```

## Quick Install (All at Once)

```powershell
# Run from root directory
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
cd infrastructure && npm install && cd ..
```

## What This Fixes

### Backend Errors
- ✅ Fixes "Cannot find type definition file for 'node'"
- ✅ Installs @types/node package
- ✅ Installs AWS SDK packages

### Infrastructure Errors
- ✅ Fixes "Cannot find module 'aws-cdk-lib'"
- ✅ Fixes "Cannot find module 'constructs'"
- ✅ Installs all AWS CDK dependencies

### Frontend Errors
- ✅ Installs tailwindcss-animate plugin
- ✅ Installs all React and AWS dependencies
- ✅ Fixes all import errors

## Verify Installation

After installing, verify everything is working:

```powershell
# Check backend
cd backend
npm run build

# Check frontend
cd ../frontend
npm run build

# Check infrastructure
cd ../infrastructure
npm run build
```

## Expected Result

After running these commands, all TypeScript errors should disappear and you should see:
- ✅ No red squiggly lines in VS Code
- ✅ Successful builds
- ✅ All imports resolved

## Troubleshooting

If you still see errors after installation:

1. **Restart VS Code/Windsurf**
   - Close and reopen the editor
   - This refreshes the TypeScript language server

2. **Clear node_modules and reinstall**
   ```powershell
   # In each directory (frontend, backend, infrastructure)
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

3. **Check Node.js version**
   ```powershell
   node --version  # Should be 18.x or higher
   ```

## Next Steps

Once dependencies are installed:
1. Configure AWS credentials
2. Update environment files
3. Deploy to AWS
4. Start development

See QUICKSTART.md for complete setup instructions.
