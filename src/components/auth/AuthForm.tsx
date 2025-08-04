import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { Separator } from '@/components/ui/separator';
type AuthMode = 'signin' | 'signup' | 'reset';
interface AuthFormProps {
  mode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
}
export const AuthForm = ({
  mode = 'signin',
  onModeChange
}: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    signUp,
    signIn,
    signInWithProvider,
    resetPassword
  } = useAuth();
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let result;
      if (mode === 'signin') {
        result = await signIn(email, password);
      } else if (mode === 'signup') {
        result = await signUp(email, password);
        if (!result?.error) {
          toast({
            title: "Account Created!",
            description: "Please check your email to verify your account."
          });
        }
      } else if (mode === 'reset') {
        result = await resetPassword(email);
        if (!result?.error) {
          toast({
            title: "Reset Link Sent!",
            description: "Please check your email for the password reset link."
          });
          onModeChange?.('signin');
          return;
        }
      }
      if (result?.error) {
        const getErrorMessage = (error: any) => {
          const message = error.message.toLowerCase();
          if (message.includes('email already registered') || message.includes('user already registered')) {
            return 'An account with this email already exists. Please sign in instead.';
          }
          if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
            return 'Invalid email or password. Please check your credentials and try again.';
          }
          if (message.includes('email not confirmed')) {
            return 'Please check your email and click the confirmation link before signing in.';
          }
          if (message.includes('weak password')) {
            return 'Password is too weak. Please use at least 8 characters with a mix of letters and numbers.';
          }
          if (message.includes('rate limit')) {
            return 'Too many attempts. Please wait a few minutes before trying again.';
          }
          return error.message;
        };

        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: getErrorMessage(result.error)
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleProviderSignIn = async (provider: 'google') => {
    try {
      const { error } = await signInWithProvider(provider);
      if (error) {
        const getProviderErrorMessage = (error: any) => {
          const message = error.message.toLowerCase();
          if (message.includes('popup') || message.includes('window')) {
            return 'Popup was blocked or closed. Please allow popups and try again.';
          }
          if (message.includes('network')) {
            return 'Network error. Please check your connection and try again.';
          }
          if (message.includes('oauth')) {
            return 'Authentication service is temporarily unavailable. Please try again later.';
          }
          return error.message;
        };

        toast({
          variant: "destructive",
          title: "Social Login Error",
          description: getProviderErrorMessage(error)
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect to authentication service"
      });
    }
  };
  const getTitle = () => {
    switch (mode) {
      case 'signin':
        return 'Welcome back';
      case 'signup':
        return 'Create your account';
      case 'reset':
        return 'Reset password';
      default:
        return 'Sign In';
    }
  };
  const getDescription = () => {
    switch (mode) {
      case 'signin':
        return 'Sign in to your account to continue';
      case 'signup':
        return 'Create a new account to get started';
      case 'reset':
        return 'Enter your email to receive a reset link';
      default:
        return 'Please sign in to continue';
    }
  };
  return <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">{getTitle()}</CardTitle>
        <CardDescription className="text-center">
          {getDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {mode !== 'reset' && <>
            {/* Google Sign-In Button - Official Design */}
            <button
              type="button"
              onClick={() => handleProviderSignIn('google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
            

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
          </>}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
            </div>
          </div>

          {mode !== 'reset' && <div className="space-y-2">
              
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10" required />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
          </Button>
        </form>

        {/* Navigation Links */}
        <div className="text-center space-y-2">
          {mode === 'signin' && <>
              <Button type="button" variant="link" onClick={() => onModeChange?.('reset')} className="text-sm">
                Forgot your password?
              </Button>
              <div className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Button type="button" variant="link" onClick={() => onModeChange?.('signup')} className="p-0 h-auto">
                  Sign up
                </Button>
              </div>
            </>}

          {mode === 'signup' && <div className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Button type="button" variant="link" onClick={() => onModeChange?.('signin')} className="p-0 h-auto">
                Sign in
              </Button>
            </div>}

          {mode === 'reset' && <Button type="button" variant="link" onClick={() => onModeChange?.('signin')} className="text-sm">
              Back to sign in
            </Button>}
        </div>
      </CardContent>
    </Card>;
};