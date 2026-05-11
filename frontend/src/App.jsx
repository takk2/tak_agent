import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 세션 확인
    const session = localStorage.getItem('tak_session');
    if (session) {
      const sessionData = JSON.parse(session);
      setUser(sessionData.user);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, session) => {
    localStorage.setItem('tak_session', JSON.stringify({ user: userData, session }));
    setUser(userData);
    navigate('/settings');
  };

  const handleLogout = () => {
    localStorage.removeItem('tak_session');
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/settings" /> : <Login onLogin={handleLogin} />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/settings" /> : <Signup onSignup={handleLogin} />}
      />
      <Route
        path="/settings"
        element={user ? <Settings user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
      />
      <Route path="/" element={<Navigate to={user ? "/settings" : "/login"} />} />
    </Routes>
  );
}

export default App;
