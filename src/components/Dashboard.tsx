import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { LogOut, MessageSquare, Database, Check } from 'lucide-react';
import { OneDriveFileBrowser } from './OneDriveFileBrowser';
import { ChatInterface } from './ChatInterface';
import { OneDriveIcon } from './icons/OneDriveIcon';
import { PublicClientApplication } from '@azure/msal-browser';
import { graphScopes } from '../config/authConfig';

interface DashboardProps {
  userName: string;
  msalInstance: PublicClientApplication;
  onLogout: () => void;
}

type ViewMode = 'chat' | 'onedrive';

export function Dashboard({ userName, msalInstance, onLogout }: DashboardProps) {
  const [currentView, setCurrentView] = useState<ViewMode>('chat');
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectOneDrive = async () => {
    setIsConnecting(true);
    try {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Request OneDrive permissions
      const response = await msalInstance.acquireTokenPopup({
        scopes: graphScopes.onedrive,
        account: accounts[0]
      });

      setAccessToken(response.accessToken);
      setIsConnected(true);
      setCurrentView('onedrive');
    } catch (error) {
      console.error('OneDrive connection failed:', error);
      alert('Failed to connect to OneDrive. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = () => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.logoutPopup({
        account: accounts[0]
      }).then(() => {
        onLogout();
      });
    }
  };

  const handleViewChange = (view: ViewMode) => {
    if (view === 'onedrive' && !isConnected) {
      handleConnectOneDrive();
    } else {
      setCurrentView(view);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="border-b border-white/10 px-8 py-4 flex-shrink-0"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <h1 
              className="text-white"
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '1.25rem',
                fontWeight: 300,
                letterSpacing: '-0.01em'
              }}
            >
              Compass for MGFO
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span 
              className="text-white/60"
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 300,
                fontSize: '0.875rem'
              }}
            >
              {userName}
            </span>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-transparent border-white/20 text-white hover:bg-white/5 hover:border-white/40 transition-all duration-300"
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 300
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="border-b border-white/10 px-8 flex-shrink-0"
      >
        <div className="max-w-7xl mx-auto flex gap-1">
          {/* Chat Tab */}
          <button
            onClick={() => handleViewChange('chat')}
            className={`px-6 py-4 border-b-2 transition-all duration-300 ${
              currentView === 'chat'
                ? 'border-white text-white'
                : 'border-transparent text-white/50 hover:text-white/70'
            }`}
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 300,
              fontSize: '0.9375rem'
            }}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Chat</span>
            </div>
          </button>

          {/* Update Knowledge Base Tab */}
          <button
            onClick={() => handleViewChange('onedrive')}
            className={`px-6 py-4 border-b-2 transition-all duration-300 group ${
              currentView === 'onedrive'
                ? 'border-white text-white'
                : 'border-transparent text-white/50 hover:text-white/70'
            }`}
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 300,
              fontSize: '0.9375rem'
            }}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <div className="flex flex-col items-start">
                <span>Update Knowledge Base</span>
                <span 
                  className={`flex items-center gap-1.5 ${
                    isConnected ? 'text-blue-400' : 'text-white/40'
                  }`}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 300
                  }}
                >
                  <OneDriveIcon className="w-3 h-3" />
                  {isConnected ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Connected</span>
                    </>
                  ) : (
                    <span>Connect OneDrive</span>
                  )}
                </span>
              </div>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentView === 'chat' ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <ChatInterface />
            </motion.div>
          ) : (
            <motion.div
              key="onedrive"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full overflow-auto"
            >
              <div className="max-w-7xl mx-auto px-8 py-8">
                {isConnected ? (
                  <OneDriveFileBrowser accessToken={accessToken} />
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <OneDriveIcon className="w-24 h-24 mb-6 opacity-60" />
                    <p 
                      className="text-white/60 mb-8"
                      style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: '1.125rem',
                        fontWeight: 300
                      }}
                    >
                      {isConnecting ? 'Connecting to OneDrive...' : 'Connect your OneDrive to manage your knowledge base'}
                    </p>
                    
                    {!isConnecting && (
                      <Button
                        onClick={handleConnectOneDrive}
                        className="px-10 py-7 bg-white text-black hover:bg-white/90 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                        style={{
                          fontFamily: 'Inter, system-ui, sans-serif',
                          fontSize: '1.125rem',
                          fontWeight: 400,
                          letterSpacing: '0.01em',
                          borderRadius: '0.75rem'
                        }}
                      >
                        <OneDriveIcon className="w-6 h-6 mr-3" />
                        Connect OneDrive
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
