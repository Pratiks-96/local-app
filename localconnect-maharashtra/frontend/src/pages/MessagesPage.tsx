import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  name?: string;
  isGroup: boolean;
  members: { user: { id: string; firstName: string; lastName: string } }[];
  messages: { content: string; createdAt: string }[];
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string };
}

export default function MessagesPage() {
  const { conversationId } = useParams();
  const { accessToken, user } = useAuthStore();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/messages/conversations');
      return data as Conversation[];
    },
  });

  const activeId = conversationId || conversations[0]?.id;

  useEffect(() => {
    if (!activeId || !accessToken) return;
    api.get(`/messages/conversations/${activeId}/messages`).then(({ data }) => setMessages(data));

    const socket = io(window.location.origin, {
      path: '/socket.io',
      auth: { token: accessToken },
    });
    socketRef.current = socket;
    socket.emit('join:conversation', activeId);
    socket.on('message:new', (msg: Message) => {
      if (msg) setMessages((prev) => [...prev, msg]);
    });
    return () => { socket.disconnect(); };
  }, [activeId, accessToken]);

  const sendMessage = () => {
    if (!text.trim() || !activeId) return;
    socketRef.current?.emit('message:send', { conversationId: activeId, content: text });
    setText('');
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
      <div className="card overflow-hidden md:col-span-1">
        <div className="p-4 border-b font-semibold">Messages</div>
        <div className="overflow-y-auto max-h-full">
          {conversations.map((c) => (
            <a
              key={c.id}
              href={`/messages/${c.id}`}
              className={`block p-4 border-b hover:bg-[hsl(var(--muted))] ${c.id === activeId ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}
            >
              <p className="font-medium text-sm">
                {c.isGroup ? c.name : c.members.filter((m) => m.user.id !== user?.id).map((m) => m.user.firstName).join(', ')}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                {c.messages[0]?.content || 'No messages yet'}
              </p>
            </a>
          ))}
        </div>
      </div>

      <div className="card md:col-span-2 flex flex-col">
        {activeId ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-xl px-4 py-2 text-sm ${m.sender.id === user?.id ? 'bg-brand-600 text-white' : 'bg-[hsl(var(--muted))]'}`}>
                    <p>{m.content}</p>
                    <p className="text-xs opacity-70 mt-1">{formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="input flex-1" placeholder="Type a message..." />
              <button onClick={sendMessage} className="btn-primary">Send</button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
