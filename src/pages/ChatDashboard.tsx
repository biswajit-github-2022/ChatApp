import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import NewChatModal from '../components/NewChatModal';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/Dashboard.css';

interface Chat {
  _id: string;
  chatType: 'direct' | 'group';
  chatName: string;
  lastMessage: string;
  lastMessageAt: Date;
  participants: string[];
}

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export default function ChatDashboard({ user, onLogout }: DashboardProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  const loadChats = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const response = await api.get('/api/chats');
      setChats(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load chats');
      setChats([]);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadChats(true);
    const interval = setInterval(() => loadChats(false), 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('chatapp-theme') as 'dark' | 'light' | null;
    const nextTheme = savedTheme || 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  }, []);

  const handleThemeToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('chatapp-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleCreateDirectChat = async (otherUserId: string) => {
    try {
      await api.post('/api/chats/direct', { otherUserId });
      await loadChats();
      setShowNewChatModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create chat');
    }
  };

  const handleCreateGroupChat = async (chatName: string, participantIds: string[]) => {
    try {
      await api.post('/api/chats/group', { chatName, participantIds });
      await loadChats();
      setShowNewChatModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create group chat');
    }
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setError('');
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      await api.delete('/api/users/me');
      onLogout();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete account');
    } finally {
      setShowDeleteAccountModal(false);
      setShowMenu(false);
    }
  };

  const handleConfirmDeleteChat = async () => {
    if (!chatToDelete) {
      return;
    }

    try {
      await api.delete(`/api/chats/${chatToDelete._id}`);
      setChats((prev) => prev.filter((chat) => chat._id !== chatToDelete._id));
      if (selectedChat?._id === chatToDelete._id) {
        setSelectedChat(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete chat');
    } finally {
      setChatToDelete(null);
    }
  };

  const showSidebar = !isMobile || !selectedChat;
  const showMain = !isMobile || !!selectedChat;

  return (
    <div className="dashboard-container">
      {showSidebar && <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h1>💬 ChatApp</h1>
          <div className="user-menu">
            <span className="user-badge">{user.username}</span>
            <button
              className="menu-btn"
              onClick={() => setShowMenu((prev) => !prev)}
              title="Open menu"
            >
              ⋮
            </button>
            {showMenu && (
              <div className="user-dropdown">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onLogout();
                  }}
                >
                  Logout
                </button>
                <button
                  className="theme-switch-row"
                  onClick={handleThemeToggle}
                  title="Toggle theme"
                >
                  <span>Theme</span>
                  <span className={`theme-switch ${theme === 'light' ? 'light' : ''}`} />
                </button>
                <button
                  className="danger"
                  onClick={() => {
                    setShowDeleteAccountModal(true);
                    setShowMenu(false);
                  }}
                >
                  Delete account
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading">Loading chats...</div>
        ) : chats.length === 0 ? (
          <div className="no-chats">
            <p>No chats yet</p>
            <p className="text-sm">Click "New Chat" to start messaging</p>
          </div>
        ) : (
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={handleSelectChat}
            onRequestDeleteChat={setChatToDelete}
          />
        )}

        <button
          className="floating-new-chat-btn"
          onClick={() => setShowNewChatModal(true)}
          title="New chat"
        >
          +
        </button>
      </div>}

      {showMain && <div className="dashboard-main">
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            user={user}
            api={api}
            onBack={isMobile ? () => setSelectedChat(null) : undefined}
            onClose={!isMobile ? () => setSelectedChat(null) : undefined}
          />
        ) : (
          <div className="empty-state">
            <h2>No chat selected</h2>
            <p>Select a chat from the list or create a new one to start messaging</p>
          </div>
        )}
      </div>}

      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onCreateDirectChat={handleCreateDirectChat}
          onCreateGroupChat={handleCreateGroupChat}
          api={api}
        />
      )}

      {chatToDelete && (
        <ConfirmModal
          title="Delete chat?"
          message="This chat and all its messages will be deleted for all members."
          confirmLabel="Delete chat"
          destructive
          onCancel={() => setChatToDelete(null)}
          onConfirm={handleConfirmDeleteChat}
        />
      )}

      {showDeleteAccountModal && (
        <ConfirmModal
          title="Delete account?"
          message="Are you sure? Your direct chats will be deleted, and you will be removed from group chats."
          confirmLabel="Delete account"
          destructive
          onCancel={() => setShowDeleteAccountModal(false)}
          onConfirm={handleConfirmDeleteAccount}
        />
      )}

    </div>
  );
}
