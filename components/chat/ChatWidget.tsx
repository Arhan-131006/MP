'use client';

import React from "react"

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Send, X } from 'lucide-react';

interface Message {
  _id: string;
  senderId: { _id: string; firstName: string; lastName: string; profileImage?: string };
  receiverId: { _id: string; firstName: string; lastName: string; profileImage?: string };
  message: string;
  createdAt: string;
}

interface ChatWidgetProps {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  onClose?: () => void;
}

export function ChatWidget({
  conversationId,
  otherUserId,
  otherUserName,
  onClose,
}: ChatWidgetProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 2 seconds
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat?conversationId=${conversationId}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to fetch messages');
        return;
      }

      setMessages(data.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: otherUserId,
          message: newMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send message',
          variant: 'destructive',
        });
        return;
      }

      setNewMessage('');
      fetchMessages();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md h-96 flex flex-col shadow-lg">
      {/* Header */}
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-base">{otherUserName}</CardTitle>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X size={16} />
          </Button>
        )}
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${msg.senderId._id === otherUserId ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.senderId._id === otherUserId
                    ? 'bg-muted text-foreground'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <p>{msg.message}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t p-3 flex gap-2">
        <Input
          placeholder="Type message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={loading}
          className="text-sm"
        />
        <Button
          type="submit"
          disabled={loading || !newMessage.trim()}
          size="sm"
          className="shrink-0"
        >
          <Send size={16} />
        </Button>
      </form>
    </Card>
  );
}
