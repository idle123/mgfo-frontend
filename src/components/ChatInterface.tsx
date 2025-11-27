import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, ExternalLink } from 'lucide-react';
import { QUERY_ENDPOINT } from '../config/apiConfig';
import { TENANT_ID } from '../config/authConfig';
import { toast } from 'sonner';

interface Citation {
  doc_id: string;
  text_snippet: string;
  score: number;
  page_range: number[] | null;
  onedrive_url: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: Citation[];
  latency_ms?: number;
  error?: boolean;
}

type ChatInterfaceProps = {
  msalInstance: any; // PublicClientApplication
  apiScope: string[]; // ["api://<API_CLIENT_ID>/user_impersonation"]
};

export function ChatInterface({ msalInstance, apiScope }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant for navigating your organization\'s knowledge. Ask me anything about your connected data sources.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Get API token for backend authentication
  const getApiToken = async () => {
    const accounts = msalInstance.getAllAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error("No signed-in account found");
    }
    const account = accounts[0];
    
    try {
      const silent = await msalInstance.acquireTokenSilent({ 
        scopes: apiScope, 
        account 
      });
      return silent.accessToken;
    } catch (err: any) {
      // If silent fails, try popup
      const popup = await msalInstance.acquireTokenPopup({ scopes: apiScope });
      return popup.accessToken;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      // Get API token
      const apiToken = await getApiToken();

      // Call backend query API
      const response = await fetch(QUERY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          query: currentInput,
          top_k: 5,
          tenant_id: TENANT_ID,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Query failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || 'No answer found.',
        timestamp: new Date(),
        citations: data.citations || [],
        latency_ms: data.latency_ms,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    } catch (error: any) {
      console.error('Query error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Failed to process your query'}`,
        timestamp: new Date(),
        error: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
      
      toast.error('Failed to get answer', {
        description: error.message || 'Please try again',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Messages area - simple scrollable container */}
      <div className="flex-1 overflow-y-scroll px-6">
        <div className="max-w-4xl mx-auto py-8 space-y-6">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.role === 'assistant' ? 'w-full' : ''}`}>
                <div
                  className={`rounded-2xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-white text-black'
                      : message.error
                      ? 'bg-red-500/10 text-red-300 border border-red-500/30'
                      : 'bg-white/5 text-white border border-white/10'
                  }`}
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontWeight: 300,
                    lineHeight: '1.6'
                  }}
                >
                  {message.content}
                  
                  {message.role === 'assistant' && message.latency_ms && (
                    <div className="text-white/40 text-xs mt-2">
                      Response time: {message.latency_ms}ms
                    </div>
                  )}
                </div>

                {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div 
                      className="text-white/60 text-sm"
                      style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontWeight: 400,
                      }}
                    >
                      Sources ({message.citations.length}):
                    </div>
                    {message.citations.map((citation, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => {
                          if (citation.onedrive_url) {
                            window.open(citation.onedrive_url, '_blank');
                          }
                        }}
                        style={{
                          fontFamily: 'Inter, system-ui, sans-serif',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white/80 font-medium text-sm">
                                [{idx + 1}] {citation.doc_id}
                              </span>
                              {citation.page_range && citation.page_range.length > 0 && (
                                <span className="text-white/50 text-xs">
                                  (Page {citation.page_range[0]}{citation.page_range[1] !== citation.page_range[0] ? `-${citation.page_range[1]}` : ''})
                                </span>
                              )}
                              <span className="text-blue-400 text-xs ml-auto">
                                Score: {(citation.score * 100).toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-white/60 text-sm line-clamp-2">
                              {citation.text_snippet}
                            </p>
                          </div>
                          {citation.onedrive_url && (
                            <ExternalLink className="w-4 h-4 text-white/40 flex-shrink-0" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div
                className="bg-white/5 text-white border border-white/10 rounded-2xl px-6 py-4"
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 300
                }}
              >
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-white/10 bg-black flex-shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="relative">
            <Textarea
              id="chat-input"
              name="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your data..."
              className="w-full min-h-[60px] bg-white/5 border-white/20 text-white placeholder:text-white/40 resize-none pr-14 rounded-xl focus:border-white/40 focus:ring-0"
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 300
              }}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              className="absolute right-3 bottom-3 bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:hover:bg-white"
              size="icon"
              style={{
                borderRadius: '0.5rem'
              }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p
            className="text-white/40 mt-3 text-center"
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 300
            }}
          >
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}