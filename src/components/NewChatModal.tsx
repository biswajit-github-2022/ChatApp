import { useState } from 'react';
import type { AxiosInstance } from 'axios';
import '../styles/Modal.css';

interface User {
  _id: string;
  username: string;
}

interface NewChatModalProps {
  onClose: () => void;
  onCreateDirectChat: (userId: string) => void;
  onCreateGroupChat: (chatName: string, participantIds: string[]) => void;
  api: AxiosInstance;
}

export default function NewChatModal({
  onClose,
  onCreateDirectChat,
  onCreateGroupChat,
  api
}: NewChatModalProps) {
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setError('');

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/api/users/search', {
        params: { query }
      });
      setSearchResults(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Search failed');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    if (mode === 'direct') {
      onCreateDirectChat(user._id);
      return;
    }

    setSelectedUsers((prev) => {
      if (prev.some((selected) => selected._id === user._id)) {
        return prev.filter((selected) => selected._id !== user._id);
      }
      return [...prev, user];
    });
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    if (selectedUsers.length < 2) {
      setError('Select at least 2 users for a group chat');
      return;
    }

    onCreateGroupChat(
      groupName.trim(),
      selectedUsers.map((user) => user._id)
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Start New Chat</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="chat-mode-tabs">
            <button
              className={mode === 'direct' ? 'active' : ''}
              onClick={() => {
                setMode('direct');
                setError('');
              }}
            >
              Direct
            </button>
            <button
              className={mode === 'group' ? 'active' : ''}
              onClick={() => {
                setMode('group');
                setError('');
              }}
            >
              Group
            </button>
          </div>

          {mode === 'group' && (
            <div className="search-box">
              <input
                type="text"
                placeholder="Group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          )}

          <div className="search-box">
            <input
              type="text"
              placeholder={mode === 'direct' ? 'Search a user...' : 'Search users to add...'}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
          </div>

          {mode === 'group' && selectedUsers.length > 0 && (
            <div className="selected-users">
              {selectedUsers.map((user) => (
                <span key={user._id} className="selected-user-pill">
                  {user.username}
                </span>
              ))}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">Searching...</div>
          ) : searchResults.length === 0 && searchQuery ? (
            <div className="no-results">No users found</div>
          ) : searchResults.length === 0 ? (
            <div className="hint">Type a username to search</div>
          ) : (
            <div className="user-list">
              {Array.isArray(searchResults) ? searchResults.map((user) => (
                <button
                  key={user._id}
                  className="user-item"
                  onClick={() => handleSelectUser(user)}
                >
                  <span className="user-avatar">👤</span>
                  <span className="user-name">{user.username}</span>
                  <span className="arrow">
                    {mode === 'direct'
                      ? '→'
                      : selectedUsers.some((selected) => selected._id === user._id)
                        ? '✓'
                        : '+'}
                  </span>
                </button>
              )) : null}
            </div>
          )}

          {mode === 'group' && (
            <button className="create-group-btn" onClick={handleCreateGroup}>
              Create Group Chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
