import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface AuthProps {
  onSuccess: (user: User) => void;
  onCancel: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess, onCancel }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let res;
      if (isLogin) {
        res = await api.login(email, password);
      } else {
        res = await api.signup(email, password, name);
      }
      
      localStorage.setItem('todoy_token', res.token);
      localStorage.setItem('todoy_user', JSON.stringify(res.user));
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const TodoyLogo = () => (
    <span className="font-black tracking-tight inline-flex items-baseline text-2xl" style={{ fontFamily: '"Rounded Mplus 1c", "Varela Round", sans-serif' }}>
      <span className="text-[#2dd4bf]">t</span>
      <span className="text-[#34d399]">o</span>
      <span className="text-[#facc15]">d</span>
      <span className="text-[#f43f5e]">o</span>
      <span className="text-[#a78bfa]">y</span>
    </span>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-8">
        <div className="flex justify-between items-center mb-8">
          <TodoyLogo />
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-sm">
            Cancel
          </button>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="text-slate-500 mb-6 text-sm">
          {isLogin ? 'Enter your details to sign in.' : 'Start organizing your life today.'}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Your Name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
          >
            {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};