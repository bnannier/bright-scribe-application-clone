import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, BookOpen, Zap } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'reset';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const { user, loading } = useAuth();

  // Redirect authenticated users to home page
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary items-center justify-center p-12">
        <div className="max-w-md text-center text-white space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Sparkles className="h-8 w-8" />
              <h1 className="text-4xl font-bold">BrightScribe</h1>
            </div>
            <p className="text-xl opacity-90">
              Your intelligent note-taking companion
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4 text-left">
              <BookOpen className="h-6 w-6 mt-1 opacity-80" />
              <div>
                <h3 className="font-semibold">Rich Text Editor</h3>
                <p className="text-sm opacity-75">Create beautiful notes with formatting, images, and more</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 text-left">
              <Zap className="h-6 w-6 mt-1 opacity-80" />
              <div>
                <h3 className="font-semibold">Instant Sync</h3>
                <p className="text-sm opacity-75">Access your notes anywhere with real-time synchronization</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile branding */}
          <div className="lg:hidden text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-primary">
              <Sparkles className="h-6 w-6" />
              <h1 className="text-2xl font-bold">BrightScribe</h1>
            </div>
            <p className="text-muted-foreground">Your intelligent note-taking companion</p>
          </div>
          
          <AuthForm mode={mode} onModeChange={setMode} />
        </div>
      </div>
    </div>
  );
};

export default Auth;