import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, session, isOnline } = useAuth();

  console.log('🛡️ ProtectedRoute render:', { 
    loading, 
    hasUser: !!user, 
    hasSession: !!session,
    isOnline,
    userEmail: user?.email 
  });

  // Show loading state while checking authentication
  if (loading) {
    console.log('🛡️ ProtectedRoute: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not authenticated (only when online or no cached session)
  if (!user || !session) {
    // Allow offline access if we have cached auth data
    if (!isOnline && (user || session)) {
      console.log('🛡️ ProtectedRoute: Allowing offline access with cached auth');
    } else {
      console.log('🛡️ ProtectedRoute: Redirecting to auth');
      return <Navigate to="/auth" replace />;
    }
  }

  console.log('🛡️ ProtectedRoute: Rendering protected content');
  return <>{children}</>;
};