import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import OrganizationSetup from './components/OrganizationSetup';
import AssetDirectory from './components/AssetDirectory';
import Reports from './components/Reports';
import Notifications from './components/Notifications';
import Sidebar from './components/Sidebar';
import AllocationScreen from './features/allocation/AllocationScreen';
import BookingScreen from './features/booking/BookingScreen';
import AuditScreen from './features/audit/AuditScreen';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('org-setup');

  useEffect(() => {
    // Check if token exists in either localStorage or sessionStorage
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (user, token) => {
    setUser(user);
    setToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    setToken('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="bg-background text-on-surface font-body text-sm overflow-hidden h-screen flex">
      <Sidebar 
        currentScreen={currentScreen} 
        setCurrentScreen={setCurrentScreen} 
        user={user} 
        onLogout={handleLogout} 
      />
      {currentScreen === 'org-setup' && <OrganizationSetup user={user} />}
      {currentScreen === 'assets' && <AssetDirectory user={user} />}
      {currentScreen === 'reports' && <Reports user={user} />}
      {currentScreen === 'notifications' && <Notifications user={user} />}
      {currentScreen === 'allocation' && <AllocationScreen user={user} />}
      {currentScreen === 'booking' && <BookingScreen user={user} />}
      {currentScreen === 'audit' && <AuditScreen user={user} />}
    </div>
  );
}

export default App;