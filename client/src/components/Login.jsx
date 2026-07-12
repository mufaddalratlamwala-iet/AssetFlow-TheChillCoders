import React, { useState } from 'react';

const Login = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const endpoint = isLogin ? `${API_BASE_URL}/auth/login` : `${API_BASE_URL}/auth/signup`;
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setSuccess(isLogin ? 'Access granted! Authorizing...' : 'Account created successfully! Logging in...');
      
      // Store token
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('token', data.token);
      storage.setItem('user', JSON.stringify(data.user));

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(data.user, data.token);
        }
      }, 1000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white text-slate-900 font-body min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 cyber-grid pointer-events-none z-0"></div>
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-10 bg-slate-50/90 rounded-xl shadow-2xl backdrop-blur-md border border-slate-200 m-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-white border border-primary/20 mb-4 relative group shadow-sm">
            <span className="material-symbols-outlined text-4xl text-primary neon-text-primary group-hover:scale-110 transition-transform">
              view_in_ar
            </span>
          </div>
          <h1 className="font-headline text-3xl font-bold text-slate-900 mb-1 tracking-tight">AssetFlow</h1>
          <p className="font-label text-slate-500 text-[10px] uppercase tracking-widest">Enterprise Resource Management</p>
        </div>

        {/* Success/Error Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-error text-error text-sm rounded-r flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-secondary text-emerald-600 text-sm rounded-r flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Full Name Input (Signup only) */}
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="font-label text-xs font-semibold text-slate-700" htmlFor="name">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                  <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
                </span>
                <input
                  className="w-full bg-white border border-slate-200 rounded-lg text-slate-900 font-body px-12 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-slate-400 shadow-sm text-sm"
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="font-label text-xs font-semibold text-slate-700" htmlFor="email">Work Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                <span className="material-symbols-outlined text-slate-400 text-sm">mail</span>
              </span>
              <input
                className="w-full bg-white border border-slate-200 rounded-lg text-slate-900 font-body px-12 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-slate-400 shadow-sm text-sm"
                id="email"
                name="email"
                placeholder="name@company.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-label text-xs font-semibold text-slate-700" htmlFor="password">Access Key</label>
              {isLogin && (
                <a className="font-label text-[10px] text-primary hover:text-primary/80 transition-colors" href="#">
                  Forgot key?
                </a>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                <span className="material-symbols-outlined text-primary text-sm">key</span>
              </span>
              <input
                className="w-full bg-white border border-slate-200 rounded-lg text-slate-900 font-body px-12 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-slate-400 shadow-sm text-sm"
                id="password"
                name="password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-primary transition-colors"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-sm">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Remember Me */}
          {isLogin && (
            <div className="flex items-center">
              <input
                className="w-4 h-4 rounded border-slate-300 bg-white text-primary focus:ring-primary focus:ring-offset-white cursor-pointer"
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label className="ml-3 text-xs text-slate-600 font-body cursor-pointer select-none" htmlFor="remember">
                Stay signed in
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 space-y-4">
            <button
              className="w-full bg-primary hover:bg-primary/95 text-white font-headline font-bold py-3.5 px-4 rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  {isLogin ? 'Authorize Access' : 'Register Account'}
                  <span className="material-symbols-outlined text-sm">login</span>
                </>
              )}
            </button>
            
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500 mb-1">{isLogin ? 'New here?' : 'Already registered?'}</p>
              <button
                className="inline-block text-primary font-label text-xs hover:text-primary/80 hover:underline transition-all cursor-pointer bg-transparent border-none"
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                }}
              >
                {isLogin ? 'Request Employee Account' : 'Sign In to Existing Account'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Footer Trust Signals */}
      <div className="relative z-10 mt-8 mb-4 flex gap-6 text-slate-500 font-label text-[10px] uppercase tracking-widest opacity-80">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">verified_user</span>
          ISO 27001
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">shield</span>
          SOC 2 Compliant
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">lock</span>
          Encrypted
        </div>
      </div>
    </div>
  );
};

export default Login;
