'use client';

import { useEffect, useState } from 'react';
import { BuilderLayout } from '@/components/dashboard/BuilderLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare } from 'lucide-react';

interface Conversation {
  conversationId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  otherUser?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
}

export default function BuilderMessagesPage() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat/conversations');
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load conversations',
          variant: 'destructive',
        });
        return;
      }

      setConversations(data.data);
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
    <BuilderLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Messages</h1>
          <p className="text-muted-foreground">Communicate with vendors and workers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
              <CardDescription>{conversations.length} total</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.conversationId}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedConversation?.conversationId === conv.conversationId
                          ? 'bg-blue-100'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">
                            {conv.otherUser
                              ? `${conv.otherUser.firstName} ${conv.otherUser.lastName}`
                              : 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Widget */}
          <div className="lg:col-span-2">
            {selectedConversation && selectedConversation.otherUser ? (
              <ChatWidget
                conversationId={selectedConversation.conversationId}
                otherUserId={selectedConversation.otherUser._id}
                otherUserName={`${selectedConversation.otherUser.firstName} ${selectedConversation.otherUser.lastName}`}
              />
            ) : (
              <Card className="h-96 flex items-center justify-center">
                <CardContent className="text-center text-muted-foreground">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </BuilderLayout>
  );
}
