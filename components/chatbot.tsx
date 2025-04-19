import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, X } from "lucide-react";

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotProps {
  context: string;
  onContextChange?: (context: string) => void;
  onMessage?: (message: Message) => void;
  onStateChange?: (state: { isOpen: boolean; isLoading: boolean }) => void;
}

export function Chatbot({ context, onContextChange, onMessage, onStateChange }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 通知状态变化
  useEffect(() => {
    onStateChange?.({ isOpen, isLoading });
  }, [isOpen, isLoading, onStateChange]);

  // 通知上下文变化
  useEffect(() => {
    onContextChange?.(context);
  }, [context, onContextChange]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    onMessage?.(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context,
        }),
      });

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.content };
      setMessages(prev => [...prev, assistantMessage]);
      onMessage?.(assistantMessage);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {isOpen ? (
        <Card className="w-[400px] h-[600px] flex flex-col overflow-hidden shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
            <CardTitle>AI 助手</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 p-4 h-full overflow-hidden">
            <ScrollArea className="flex-1 h-[calc(100%-80px)] pr-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <form onSubmit={handleSubmit} className="flex gap-2 mt-auto">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入你的问题..."
                className="flex-1 min-h-[40px] resize-none"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading} className="shrink-0">
                {isLoading ? '发送中...' : '发送'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          size="icon"
          className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
} 