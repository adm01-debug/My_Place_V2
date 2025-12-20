import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Trash2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAssistenteRH, Message } from '@/hooks/useAssistenteRH';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AssistenteVirtualProps {
  isOpen: boolean;
  onClose: () => void;
}

const sugestoes = [
  'Como solicitar férias?',
  'Quando sai o holerite?',
  'Como justificar falta?',
  'Quais são meus benefícios?',
];

export function AssistenteVirtual({ isOpen, onClose }: AssistenteVirtualProps) {
  const [input, setInput] = useState('');
  const { messages, isLoading, error, sendMessage, clearMessages } = useAssistenteRH();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleSugestao = (sugestao: string) => {
    sendMessage(sugestao);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] max-w-md h-[70vh] max-h-[600px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 bg-primary">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Assistente RH</h3>
              <p className="text-xs text-muted-foreground">Online • Responde instantaneamente</p>
            </div>
          </div>
          <div className="flex gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearMessages}
                className="h-8 w-8"
                title="Limpar conversa"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">
                Olá! Como posso ajudar?
              </h4>
              <p className="text-sm text-muted-foreground mb-6">
                Pergunte sobre férias, benefícios, holerites, ponto e muito mais.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {sugestoes.map((sugestao) => (
                  <Button
                    key={sugestao}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSugestao(sugestao)}
                  >
                    {sugestao}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Digitando...</span>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Error */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <Avatar className={cn('h-8 w-8', isUser ? 'bg-primary' : 'bg-muted')}>
        <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : ''}>
          {isUser ? 'EU' : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className={cn(
          'text-[10px] mt-1',
          isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

// Floating button component
export function AssistenteButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
    >
      <Bot className="h-6 w-6" />
      <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
    </motion.button>
  );
}
