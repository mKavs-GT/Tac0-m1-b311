import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, MessageSquare, AlertCircle, Clock } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { apiFetch } from '../utils/api';

export default function Overview({ user }) {
  const [standup, setStandup] = useState({ yesterday: '', today: '', blockers: '' });
  const [isStandupSubmitted, setIsStandupSubmitted] = useState(false);
  const [standupLoading, setStandupLoading] = useState(false);
  const [standupError, setStandupError] = useState('');

  // Broadcasts — read from localStorage (GodMode writes here) + poll every 10s
  const [broadcasts, setBroadcasts] = useState([]);

  // Check today's standup status on mount
  useEffect(() => {
    if (!user?.token) return;
    const check = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/api/standups/today`, {
          
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.submitted) {
            setIsStandupSubmitted(true);
          }
        }
      } catch (e) {
        // Endpoint may not exist yet — silently ignore
      }
    };
    check();
  }, [user?.token]);

  // Poll localStorage for broadcasts every 10s
  const readBroadcasts = useCallback(() => {
    try {
      const saved = localStorage.getItem('mkavs_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        setBroadcasts(parsed.filter(n => n.type === 'broadcast').slice(0, 5));
      }
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    readBroadcasts();
    const interval = setInterval(readBroadcasts, 10000);
    return () => clearInterval(interval);
  }, [readBroadcasts]);

  const handleStandupSubmit = async (e) => {
    e.preventDefault();
    setStandupError('');
    setStandupLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/standups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          },
        body: JSON.stringify({
          yesterday: standup.yesterday,
          today: standup.today,
          blockers: standup.blockers
        })
      });
      if (res.ok) {
        setIsStandupSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setStandupError(data.error || data.message || 'Failed to submit. Try again.');
      }
    } catch (e) {
      setStandupError('Network error. Please try again.');
    } finally {
      setStandupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Broadcasts Section */}
      {broadcasts.length > 0 && (
        <div className="bg-bg-surface border border-border-main rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-bold text-text-main flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-accent" />
            Admin Broadcasts
          </h3>
          <div className="space-y-3">
            {broadcasts.map(b => (
              <div key={b.id} className="p-4 rounded-lg border border-accent bg-accent/5">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-text-main">{b.title}</h4>
                  <span className="bg-accent text-bg-root text-xs px-2 py-1 rounded font-bold uppercase">New</span>
                </div>
                <p className="text-sm text-text-muted mt-1">{b.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-main rounded-xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-text-main flex items-center gap-2 mb-4">
              <CheckCircle2 size={20} className="text-success" />
              Pending Tasks
            </h3>
            <div className="text-sm text-text-muted text-center py-8">
              No tasks assigned yet. Check your sprint board.
            </div>
          </div>
        </div>

        {/* Daily Standup */}
        <div className="bg-bg-surface border border-border-main rounded-xl p-5 shadow-sm h-full">
          <h3 className="text-lg font-bold text-text-main flex items-center gap-2 mb-4">
            <MessageSquare size={20} className="text-secondary" />
            Daily Standup
          </h3>

          {isStandupSubmitted ? (
            <div className="bg-success/10 border border-success/20 rounded-lg p-6 text-center text-success">
              <CheckCircle2 size={32} className="mx-auto mb-3" />
              <h4 className="font-bold mb-1">Standup Submitted</h4>
              <p className="text-sm opacity-80">You're all set for today. Have a great day ahead!</p>
            </div>
          ) : (
            <form onSubmit={handleStandupSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">What did you do yesterday?</label>
                <textarea
                  required
                  value={standup.yesterday}
                  onChange={(e) => setStandup({ ...standup, yesterday: e.target.value })}
                  className="w-full bg-bg-root border border-border-main rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-accent"
                  rows={3}
                  placeholder="E.g., Finished the login component..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">What will you do today?</label>
                <textarea
                  required
                  value={standup.today}
                  onChange={(e) => setStandup({ ...standup, today: e.target.value })}
                  className="w-full bg-bg-root border border-border-main rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-accent"
                  rows={3}
                  placeholder="E.g., Work on the overview page..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Any blockers?</label>
                <textarea
                  value={standup.blockers}
                  onChange={(e) => setStandup({ ...standup, blockers: e.target.value })}
                  className="w-full bg-bg-root border border-border-main rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-accent"
                  rows={2}
                  placeholder="E.g., Waiting for design assets..."
                />
              </div>
              {standupError && (
                <p className="text-rose-500 text-xs font-semibold">{standupError}</p>
              )}
              <button
                type="submit"
                disabled={standupLoading}
                className="w-full bg-accent text-bg-root font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {standupLoading ? 'Submitting...' : 'Submit Standup'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
