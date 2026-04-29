import { useEffect, useState } from 'react';
import ChatDashboard from './pages/ChatDashboard';
import Login from './pages/Login';

interface User {
  id: string;
  username: string;
}

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser) as User);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setIsLoading(false);
  }, []);

  const handleLogin = (nextToken: string, nextUser: User) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem('token', nextToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading ChatApp...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return <ChatDashboard user={user} onLogout={handleLogout} />;
}

export default App;
