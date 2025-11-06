import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatInterface() {
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m a demo assistant. To provide real answers, please connect your OneDrive knowledge base using the "Update Knowledge Base" option above.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <ScrollArea className="flex-1 px-6" ref={scrollRef}>
        <div className="max-w-4xl mx-auto py-8 space-y-6">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                  message.role === 'user'
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white border border-white/10'
                }`}
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 300,
                  lineHeight: '1.6'
                }}
              >
                {message.content}
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
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-white/10 bg-black">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="relative">
            <Textarea
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
