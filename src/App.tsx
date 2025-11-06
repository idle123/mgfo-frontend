import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Button } from './components/ui/button';
import { Dashboard } from './components/Dashboard';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest } from './config/authConfig';

// Initialize MSAL
const msalInstance = new PublicClientApplication(msalConfig);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize MSAL
    msalInstance.initialize().then(() => {
      // Handle redirect promise
      msalInstance.handleRedirectPromise().then((response) => {
        if (response) {
          // User just logged in
          setIsAuthenticated(true);
          setUserName(response.account?.name || 'User');
        } else {
          // Check if user is already logged in
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            setIsAuthenticated(true);
            setUserName(accounts[0].name || 'User');
          }
        }
        setIsInitializing(false);
      });
    });
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const response = await msalInstance.loginPopup(loginRequest);
      setIsAuthenticated(true);
      setUserName(response.account?.name || 'User');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserName('');
  };

  // Show nothing while initializing
  if (isInitializing) {
    return (
      <div className="relative w-full h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  // Show dashboard if authenticated
  if (isAuthenticated) {
    return (
      <Dashboard 
        userName={userName} 
        msalInstance={msalInstance}
        onLogout={handleLogout}
      />
    );
  }

  // Show landing page if not authenticated
  return (
    <div className="relative w-full h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Background layers */}
      <AnimatedBackground />
      
      {/* Navigation bar */}
      <motion.nav 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-10 px-8 py-6"
      >
        <div className="flex items-center justify-between">
          <div className="text-white/90" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 300, letterSpacing: '0.02em' }}>
            Compass for MGFO
          </div>
          <div className="flex gap-8 text-white/60" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          </div>
        </div>
      </motion.nav>

      {/* Hero section */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="max-w-3xl mx-auto px-8 text-center">
          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-white mb-8"
            style={{ 
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              lineHeight: '1.1',
              fontWeight: 300,
              letterSpacing: '-0.02em'
            }}
          >
            Your compass to clarity.
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mb-10 mx-auto max-w-2xl text-white/70"
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 'clamp(1rem, 2vw, 1.125rem)',
              lineHeight: '1.6',
              fontWeight: 300
            }}
          >
            Secure Enterprise Knowledge Search
          </motion.p>

          {/* Microsoft sign-in button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9 }}
          >
            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              className="group relative px-8 py-6 bg-black text-white border border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(100,150,200,0.3)]"
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '1rem',
                fontWeight: 400,
                letterSpacing: '0.02em',
                borderRadius: '0.75rem'
              }}
            >
              <svg 
                className="w-5 h-5 mr-3 inline-block" 
                viewBox="0 0 23 23" 
                fill="currentColor"
              >
                <path d="M0 0h11v11H0z" fill="#f25022"/>
                <path d="M12 0h11v11H12z" fill="#00a4ef"/>
                <path d="M0 12h11v11H0z" fill="#7fba00"/>
                <path d="M12 12h11v11H12z" fill="#ffb900"/>
              </svg>
              {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}