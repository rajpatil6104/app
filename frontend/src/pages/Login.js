import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Login = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/me`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          navigate('/dashboard');
        }
      } catch (error) {
        console.log('Not authenticated');
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkExistingSession();
  }, [navigate]);

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 via-background to-background flex items-center justify-center">
        <div className="text-stone-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-background to-background flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1634940761515-3953498f4f34?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHw0fHxhYnN0cmFjdCUyMG9yZ2FuaWMlMjBzaGFwZXMlMjBiZWlnZSUyMHplbnxlbnwwfHx8fDE3Njg0NTkxNDN8MA&ixlib=rb-4.1.0&q=85"
          alt="Abstract organic shapes"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px]"></div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-stone-900 font-heading">
              ZenTrack
            </h1>
            <p className="text-lg text-stone-600">
              Track expenses mindfully, live financially free
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-stone-900 font-heading">
                Welcome back
              </h2>
              <p className="text-stone-500">
                Sign in with your Google account to continue
              </p>
            </div>

            <Button
              data-testid="google-login-button"
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <p className="text-xs text-center text-stone-400">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-8 text-sm text-stone-500">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Private</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Fast</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
