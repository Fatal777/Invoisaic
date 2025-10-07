import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
