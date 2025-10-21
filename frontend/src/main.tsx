import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { ClerkProvider } from '@clerk/clerk-react';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import './index.css';
import './fonts.css';

// Configure AWS Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID || '',
      identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID || '',
    }
  },
  Storage: {
    S3: {
      bucket: import.meta.env.VITE_S3_BUCKET || '',
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    }
  }
});

// Get Clerk Publishable Key
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env.local file');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#F97272', // Georgia Peach for dark mode
          colorBackground: '#000000', // Full black
          colorInputBackground: '#0a0a0a',
          colorInputText: '#ffffff',
          colorText: '#ffffff',
          colorTextSecondary: '#a3a3a3',
          colorDanger: '#ef4444',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary: 'bg-[#F97272] hover:bg-[#f85c5c] text-white font-semibold',
          card: 'bg-black shadow-2xl border border-gray-900',
          headerTitle: 'text-white font-bold',
          headerSubtitle: 'text-gray-400',
          socialButtonsBlockButton: 'border-gray-800 hover:bg-gray-900 text-white',
          formFieldLabel: 'text-gray-300',
          formFieldInput: 'bg-black border-gray-800 text-white',
          footerActionLink: 'text-[#F97272] hover:text-[#f85c5c]',
          identityPreviewText: 'text-white',
          identityPreviewEditButton: 'text-[#F97272] hover:text-[#f85c5c]',
        },
      }}
    >
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </ClerkProvider>
  </React.StrictMode>,
);
