import React, { useState, useEffect } from 'react';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center relative p-6 font-body">
      {/* Background decoration */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-40"></div>
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-lg p-8 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-slate-800 border border-secondary/30 mb-6 shadow-sm">
          <span className="material-symbols-outlined text-4xl text-secondary">verified</span>
        </div>

        <h1 className="font-headline text-3xl font-bold tracking-tight mb-2">Access Authorized</h1>
        <p className="text-slate-400 text-sm mb-6">Welcome back to the AssetFlow portal</p>

        {/* User Card */}
        <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-800 text-left mb-6 space-y-3">
          <div className="flex justify-between border-b border-slate-900 pb-2">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Name</span>
            <span className="text-slate-200 text-sm font-medium">{user.name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-900 pb-2">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Email</span>
            <span className="text-slate-200 text-sm font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between border-b border-slate-900 pb-2">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Role</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {user.role}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Status</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {user.status}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-headline font-bold py-3.5 px-4 rounded-lg border border-slate-700 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          Deauthorize & Sign Out
          <span className="material-symbols-outlined text-sm">logout</span>
        </button>
      </div>
    </div>
  );
}

export default App;