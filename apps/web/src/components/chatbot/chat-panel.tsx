'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, X, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendChatMessage, type ChatHistoryEntry, type ChatProduct } from '@/lib/api/chatbot';
import { ChatProductCard } from './chat-product-card';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: ChatProduct[];
}

/** Animated typing indicator shown while the assistant is thinking. */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2" aria-label="Assistant is typing" role="status">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-[var(--color-muted)] animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

interface ChatPanelProps {
  onClose: () => void;
}

/**
 * The chat panel UI: message history, typing indicator, and input area.
 */
export function ChatPanel({ onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your Slicing Edge assistant. I can help you find the perfect knife, recommend products by type, or track your order. How can I help?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Build history from current messages (exclude welcome stub, limit to last 20)
    const history: ChatHistoryEntry[] = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-19)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const data = await sendChatMessage(text, history);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        products: data.products.length > 0 ? data.products : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, I ran into an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Slicing Edge AI Assistant"
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-primary)] px-4 py-3">
        <Bot className="h-5 w-5 shrink-0 text-white" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white leading-tight">Slicing Edge Assistant</p>
          <p className="text-xs text-white/70">Powered by Claude AI</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex flex-col gap-2', msg.role === 'user' ? 'items-end' : 'items-start')}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'rounded-br-sm bg-[var(--color-primary)] text-white'
                  : 'rounded-bl-sm bg-[var(--color-background)] text-[var(--color-foreground)]',
              )}
            >
              {msg.content}
            </div>

            {/* Inline product cards */}
            {msg.products && msg.products.length > 0 && (
              <div
                className="flex gap-2 overflow-x-auto pb-1 max-w-full"
                aria-label="Recommended products"
              >
                {msg.products.map((product) => (
                  <ChatProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start">
            <div className="rounded-2xl rounded-bl-sm bg-[var(--color-background)]">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-[var(--color-border)] px-3 py-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about knives or your order…"
          maxLength={1000}
          disabled={loading}
          aria-label="Chat message"
          className="flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-white transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
