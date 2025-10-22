# CORS Fix Applied - LiveDoc Demo

## Issue
The LiveDoc demo was experiencing CORS errors when uploading files from `https://invoisaic.xyz`:

```
Access to fetch at 'https://xpdhtqhxfa.execute-api.ap-south-1.amazonaws.com/prod/textract' 
from origin 'https://invoisaic.xyz' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause
The API Gateway was configured with `allowOrigins: ALL_ORIGINS` (`*`) combined with `allowCredentials: true`, which browsers reject as a security violation. Additionally, the Lambda function was returning `Access-Control-Allow-Origin: *` instead of the specific requesting origin.

## Solution Applied

### 1. Updated API Gateway CORS Configuration
**File**: `infrastructure/lib/invoisaic-stack.ts`

Changed from:
```typescript
allowOrigins: apigateway.Cors.ALL_ORIGINS,
allowCredentials: true
```

To:
```typescript
allowOrigins: [
  'https://invoisaic.xyz',
  'https://invoisaic.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
],
allowCredentials: false
```

### 2. Updated Lambda CORS Headers
**File**: `backend/src/lambda/textractHandler.ts`

Implemented dynamic origin matching:
```typescript
const getAllowedOrigin = (requestOrigin?: string): string => {
  const allowedOrigins = [
    'https://invoisaic.xyz',
    'https://invoisaic.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  
  return 'https://invoisaic.xyz';
};

const getCorsHeaders = (origin?: string) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(origin),
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent,Accept',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
});
```

### 3. Updated Handler Functions
All response creation functions now accept and use the requesting origin:
- `createResponse()` - accepts origin parameter
- `createErrorResponse()` - accepts origin parameter
- Main handler extracts origin from request headers and passes it through

## Deployment
Deployed via CDK on: 2025-10-22

**Command**: `cdk deploy --all --require-approval never`

**Result**: ✅ Successfully deployed
- Updated 37 API Gateway OPTIONS methods
- Updated multiple Lambda functions
- Created new API Gateway deployment

## Endpoints
- **API URL**: `https://xpdhtqhxfa.execute-api.ap-south-1.amazonaws.com/prod/`
- **WebSocket URL**: `wss://lbrbkmd3s0.execute-api.ap-south-1.amazonaws.com/prod`

## Testing
After deployment, test the LiveDoc demo at:
- Production: `https://invoisaic.xyz/demos/livedoc`
- Vercel: `https://invoisaic.vercel.app/demos/livedoc`
- Local: `http://localhost:5173/demos/livedoc`

## Verification
1. Upload a test invoice (PDF, JPG, or PNG)
2. Check browser console - should see no CORS errors
3. Verify the response includes: `Access-Control-Allow-Origin: https://invoisaic.xyz`
4. Processing should complete successfully

## Additional Notes
- The fix allows CORS for specific domains only
- `allowCredentials` is now set to `false` to avoid conflicts
- Lambda dynamically returns the correct origin header based on the request
- OPTIONS preflight requests are properly handled with matching headers
