import { useAuth, useClerk } from '@clerk/clerk-react';
import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = '/' }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Store the intended destination
      sessionStorage.setItem('redirectAfterAuth', location.pathname);
      
      // Open sign-in modal
      openSignIn({
        redirectUrl: location.pathname,
        afterSignInUrl: location.pathname,
        afterSignUpUrl: location.pathname,
      });
    }
  }, [isLoaded, isSignedIn, openSignIn, location.pathname]);

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not signed in, show nothing (modal will open)
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-gray-400">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  // User is signed in, render the protected content
  return <>{children}</>;
}
