import React, { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MessageSquare, 
  Send, 
  X, 
  Minus, 
  Sparkles,
  Bot,
  User,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentMessage } from '@codename/api';
import { cn } from '@/lib/utils';

interface AgentChatProps {
  tenantId: string;
}

export const AgentChat: React.FC<AgentChatProps> = ({ tenantId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello Boss! How can I help you automate your business today?',
      timestamp: new Date().toISOString(),
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mutation = trpc.admin.sendAgentMessage.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || mutation.isLoading) return;

    const userMsg: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const result = await mutation.mutateAsync({
        tenantId,
        message: input,
      });
      setMessages(prev => [...prev, result.response]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-violet-600 hover:bg-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.5)] border-4 border-zinc-950 transition-all hover:scale-105"
              onClick={() => setIsOpen(true)}
            >
              <MessageSquare className="h-6 w-6 text-white" />
            </Button>
          </motion.div>
        )}

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-80 md:w-96"
          >
            <Card className="glass-panel glow-medium overflow-hidden flex flex-col h-[500px]">
              {/* Header */}
              <div className="p-4 border-b border-white/5 glass-frosted flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg glass-violet text-violet-400">
                    <Bot size={18} />
                  </div>
                  <div className="leading-none">
                    <h3 className="text-sm font-bold text-white">Business Agent</h3>
                    <span className="text-[10px] text-violet-400 font-mono font-bold uppercase tracking-widest">Online</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>
                    <Minus size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>
                    <X size={16} />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center border",
                      msg.role === 'user'
                        ? "glass-frosted border-white/10 text-zinc-400"
                        : "glass-violet border-violet-500/30 text-violet-400"
                    )}>
                      {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                    </div>
                    <div className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed relative",
                      msg.role === 'user'
                        ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-tr-none shadow-lg shadow-violet-900/30"
                        : "glass-card text-zinc-200 rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {mutation.isLoading && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 shrink-0 rounded-lg glass-violet border-violet-500/30 flex items-center justify-center text-violet-400">
                      <Bot size={14} />
                    </div>
                    <div className="glass-card p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-violet-400" />
                      <span className="text-xs text-zinc-400 italic">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Footer */}
              <form onSubmit={handleSend} className="p-4 border-t border-white/5 glass-frosted">
                <div className="relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message your agent..."
                    className="glass-frosted border-white/10 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/30 pr-10 rounded-xl text-white placeholder:text-zinc-500"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    aria-label="Send message"
                    className="absolute right-1 top-1 h-8 w-8 text-violet-400 hover:text-violet-300"
                    disabled={!input.trim() || mutation.isLoading}
                  >
                    <Send size={16} />
                  </Button>
                </div>
                <p className="text-[9px] text-zinc-500 mt-2 text-center uppercase tracking-widest font-bold">
                  Contextual Agent v1.0 • obsidian secure
                </p>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
