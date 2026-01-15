import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      const hash = location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId })
        });

        if (response.ok) {
          const user = await response.json();
          navigate('/dashboard', { state: { user }, replace: true });
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Session exchange failed:', error);
        navigate('/login');
      }
    };

    processSession();
  }, [location.hash, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-background to-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-stone-200 border-t-primary"></div>
        <p className="text-stone-600">Authenticating...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
