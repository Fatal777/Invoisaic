/// <reference types="vite/client" />

interface ImportMetaEnv {
  // AWS Configuration
  readonly VITE_AWS_REGION: string;
  readonly VITE_AWS_USER_POOL_ID: string;
  readonly VITE_AWS_USER_POOL_CLIENT_ID: string;
  readonly VITE_AWS_IDENTITY_POOL_ID: string;
  
  // API Configuration
  readonly VITE_API_URL: string;
  
  // WebSocket Configuration
  readonly VITE_WEBSOCKET_URL?: string;
  
  // S3 Configuration
  readonly VITE_S3_BUCKET: string;
  
  // Feature Flags
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_ENABLE_DEMO_MODE?: string;
  
  // Clerk Authentication
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_CLERK_FRONTEND_API: string;
  readonly VITE_CLERK_JWKS_URL: string;
  
  // App Configuration
  readonly VITE_APP_TITLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
