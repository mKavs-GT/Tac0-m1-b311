import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { API_BASE_URL } from '../config';
import { apiFetch } from '../utils/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // 2. Verify with backend — fetch PostgreSQL user profile
      const res = await apiFetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      const { agent } = data;

      // 3. Pass full profile + token to app
      onLogin({
        ...agent,
        token: idToken,
        isSupport: agent.role === 'Support',
        isExecutive: agent.isExecutive || false,
        isManager: agent.isManager || false,
      });
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        setResetError('No account found with that email.');
      } else {
        setResetError('Failed to send reset email. Try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#f9f9fb] relative overflow-hidden font-sans text-[#1a1a1b]">
      <AnimatePresence mode="wait">
        {!showForgot ? (
          // ── LOGIN FORM ──
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm p-10 rounded-xl bg-white border border-[#e1e4e8] shadow-sm relative z-10"
          >
            <div className="flex justify-center mb-10">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src="/LOGOI.png" alt="MKAVS" className="w-full h-full object-contain" style={{ filter: 'grayscale(100%)' }} />
              </div>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-xl font-bold text-[#1a1a1b] mb-2 tracking-tight">Sign in to MKavs Dashboard</h2>
              <p className="text-sm text-[#6a737d]">Authorized access only</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-[10px] font-bold text-[#6a737d] uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent01mrk@gmail.com"
                  required
                  className="w-full px-3 py-2 rounded-md bg-white border border-[#d1d5da] text-[#1a1a1b] focus:outline-none focus:border-[#4a154b] focus:ring-1 focus:ring-[#4a154b]/10 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6a737d] uppercase tracking-widest mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 rounded-md bg-white border border-[#d1d5da] text-[#1a1a1b] focus:outline-none focus:border-[#4a154b] focus:ring-1 focus:ring-[#4a154b]/10 transition-all text-sm"
                />
              </div>

              {error && <p className="text-rose-600 text-xs font-semibold text-center">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-1 w-full py-2.5 rounded-md bg-[#1a1a1b] text-white font-bold hover:bg-black transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 text-sm"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => { setShowForgot(true); setResetEmail(email); }}
                className="text-[11px] text-[#6a737d] hover:text-[#4a154b] transition-colors font-medium text-center"
              >
                Forgot password?
              </button>
            </form>

            <div className="mt-10 pt-6 border-t border-[#e1e4e8] text-center">
              <p className="text-[10px] text-[#6a737d] font-bold uppercase tracking-widest">© MKAVS Global Tech</p>
            </div>
          </motion.div>
        ) : (
          // ── FORGOT PASSWORD FORM ──
          <motion.div
            key="forgot"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm p-10 rounded-xl bg-white border border-[#e1e4e8] shadow-sm relative z-10"
          >
            <div className="flex justify-center mb-10">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src="/LOGOI.png" alt="MKAVS" className="w-full h-full object-contain" style={{ filter: 'grayscale(100%)' }} />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-[#1a1a1b] mb-2 tracking-tight">Reset Password</h2>
              <p className="text-sm text-[#6a737d]">We'll send a reset link to your email</p>
            </div>

            {!resetSent ? (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-[#6a737d] uppercase tracking-widest mb-2">Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="agent01mrk@gmail.com"
                    required
                    className="w-full px-3 py-2 rounded-md bg-white border border-[#d1d5da] text-[#1a1a1b] focus:outline-none focus:border-[#4a154b] focus:ring-1 focus:ring-[#4a154b]/10 transition-all text-sm"
                  />
                </div>
                {resetError && <p className="text-rose-600 text-xs font-semibold text-center">{resetError}</p>}
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 rounded-md bg-[#1a1a1b] text-white font-bold hover:bg-black transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 text-sm"
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button type="button" onClick={() => setShowForgot(false)} className="text-[11px] text-[#6a737d] hover:text-[#4a154b] transition-colors font-medium text-center">
                  ← Back to Sign In
                </button>
              </form>
            ) : (
              <div className="text-center space-y-5">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">✓</span>
                </div>
                <p className="text-sm text-[#1a1a1b] font-semibold">Reset link sent!</p>
                <p className="text-xs text-[#6a737d]">Check <strong>{resetEmail}</strong> for the password reset link.</p>
                <button
                  onClick={() => { setShowForgot(false); setResetSent(false); setResetEmail(''); }}
                  className="text-[11px] text-[#4a154b] hover:underline font-medium"
                >
                  ← Back to Sign In
                </button>
              </div>
            )}

            <div className="mt-10 pt-6 border-t border-[#e1e4e8] text-center">
              <p className="text-[10px] text-[#6a737d] font-bold uppercase tracking-widest">© MKAVS Global Tech</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
