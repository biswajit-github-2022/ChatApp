import { useState, useEffect, useRef } from 'react';
import type { AxiosInstance } from 'axios';
import '../styles/ChatWindow.css';

interface Message {
  _id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: Date;
}

interface Chat {
  _id: string;
  chatType: 'direct' | 'group';
  chatName: string;
  lastMessage: string;
  participants: string[];
}

interface ChatWindowProps {
  chat: Chat;
  user: any;
  api: AxiosInstance;
  onBack?: () => void;
  onClose?: () => void;
}

export default function ChatWindow({ chat, user, api, onBack, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const response = await api.get(`/api/messages/${chat._id}`);
      setMessages(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load messages');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setError('');
    loadMessages(true);
    // Load messages every 2 seconds for real-time effect (in production, use WebSocket)
    const interval = setInterval(() => loadMessages(false), 2000);
    return () => clearInterval(interval);
  }, [chat._id]);

  useEffect(() => {
    if (!error) return;
    const timeoutId = setTimeout(() => setError(''), 7000);
    return () => clearTimeout(timeoutId);
  }, [error]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const response = await api.post('/api/messages', {
        chatId: chat._id,
        content: newMessage
      });

      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        {onBack && (
          <button className="back-btn" onClick={onBack} aria-label="Back to chats">
            ←
          </button>
        )}
        <h2>{chat.chatType === 'group' ? '👥' : '👤'} {chat.chatName}</h2>
        <span className="member-count">
          {chat.participants.length} member{chat.participants.length > 1 ? 's' : ''}
        </span>
        {onClose && (
          <button className="close-chat-btn" onClick={onClose} aria-label="Close chat">
            ×
          </button>
        )}
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`message ${msg.senderId === user.id ? 'sent' : 'received'}`}
              >
                <div className="message-content">
                  {chat.chatType === 'group' && msg.senderId !== user.id && (
                    <div className="message-sender">{msg.senderName}</div>
                  )}
                  <div className="message-text">{msg.content}</div>
                  <div className="message-time">{formatTime(msg.createdAt)}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSendMessage} className="message-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="message-input"
          disabled={sending}
        />
        <button
          type="submit"
          className="send-btn"
          disabled={sending || !newMessage.trim()}
          aria-label="Send message"
        >
          {sending ? (
            <span className="send-icon">⏳</span>
          ) : (
            <span className="send-icon">✈️</span>
          )}
        </button>
      </form>
    </div>
  );
}
