import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.auth.login(email, password);
        onAuthSuccess(res.user);
      } else {
        const res = await api.auth.register(username, email, password);
        onAuthSuccess(res.user);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // Mock Google OAuth integration
      const randomGoogleId = Math.random().toString(36).substring(2, 15);
      const res = await api.auth.googleLogin(
        'google.demo@lifeflow.app',
        'Google Explorer',
        randomGoogleId
      );
      onAuthSuccess(res.user);
    } catch (err) {
      console.error(err);
      setError('Google Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative">
      {/* Dynamic Glow Aura */}
      <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-3xl opacity-20 blur-2xl -z-10"></div>
      
      <div className="glass border border-slate-800 rounded-3xl p-8 shadow-glass relative z-15 overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-neon-violet mb-4">
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
          </div>
          <h2 className="font-display text-3xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-violet-400 bg-clip-text text-transparent">
            Welcome to LifeFlow
          </h2>
          <p className="text-sm text-slate-400 mt-1">Your premium personal flow system</p>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 p-1.5 bg-slate-900/60 border border-slate-850 rounded-2xl mb-6">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all relative ${
              isLogin ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isLogin && (
              <motion.div 
                layoutId="auth-tab"
                className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl -z-10 shadow-[0_0_12px_rgba(124,58,237,0.3)]"
              />
            )}
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all relative ${
              !isLogin ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {!isLogin && (
              <motion.div 
                layoutId="auth-tab"
                className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl -z-10 shadow-[0_0_12px_rgba(124,58,237,0.3)]"
              />
            )}
            Register
          </button>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs overflow-hidden"
            >
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="username"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-semibold text-slate-300">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:shadow-neon-violet transition-all text-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:shadow-neon-violet transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:shadow-neon-violet transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold text-white shadow-neon-violet hover:brightness-110 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <span>{isLogin ? 'Login Now' : 'Create Account'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase font-medium">Or continue with</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Mock Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-300 font-semibold hover:text-slate-100 flex items-center justify-center gap-2.5 transition-colors cursor-pointer text-sm"
        >
          {/* Flat Google logo */}
          <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24">
            <path
              fill="#ea4335"
              d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.281 1.09 15.547 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.795-.085-1.4-.195-1.925H12.24z"
            />
          </svg>
          Google Cloud Demo Account
        </button>

      </div>
    </div>
  );
}
