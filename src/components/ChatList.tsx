import '../styles/ChatList.css';

interface Chat {
  _id: string;
  chatType: 'direct' | 'group';
  chatName: string;
  lastMessage: string;
  lastMessageAt: Date;
  participants: string[];
}

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  onRequestDeleteChat: (chat: Chat) => void;
}

export default function ChatList({
  chats,
  selectedChat,
  onSelectChat,
  onRequestDeleteChat
}: ChatListProps) {
  if (!Array.isArray(chats)) {
    return null;
  }

  const formatTime = (date: Date) => {
    const msgDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return msgDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return msgDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="chat-list">
      {chats.map((chat) => (
        <div
          key={chat._id}
          className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
          onClick={() => onSelectChat(chat)}
        >
          <div className="chat-item-content">
            <div className="chat-item-header">
              <h3 className="chat-name">
                {chat.chatType === 'group' ? '👥 ' : '👤 '}
                {chat.chatName}
              </h3>
              <span className="chat-time">{formatTime(chat.lastMessageAt)}</span>
            </div>
            <p className="chat-preview">
              {chat.lastMessage || '(No messages yet)'}
            </p>
          </div>
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onRequestDeleteChat(chat);
            }}
            title="Delete chat"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
