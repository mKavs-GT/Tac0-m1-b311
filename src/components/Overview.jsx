import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Play, Square, MessageSquare, AlertCircle, Clock } from 'lucide-react';

export default function Overview({ user }) {
  const [standup, setStandup] = useState({ yesterday: '', today: '', blockers: '' });
  const [isStandupSubmitted, setIsStandupSubmitted] = useState(false);
  const [broadcasts, setBroadcasts] = useState([]);
  
  // Basic timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    // TODO: Fetch broadcasts and standup status from API
    // Placeholder data
    setBroadcasts([
      { id: '1', title: 'Welcome to mKavs', message: 'We are glad to have you here.', isRead: false, createdAt: new Date() }
    ]);
  }, [user]);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleStandupSubmit = (e) => {
    e.preventDefault();
    setIsStandupSubmitted(true);
    // TODO: POST to API
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
              <div key={b.id} className={`p-4 rounded-lg border ${!b.isRead ? 'border-accent bg-accent/5' : 'border-border-main bg-bg-muted'}`}>
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-text-main">{b.title}</h4>
                  {!b.isRead && <span className="bg-accent text-bg-root text-xs px-2 py-1 rounded font-bold uppercase">New</span>}
                </div>
                <p className="text-sm text-text-muted mt-1">{b.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Timer & Tasks */}
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-main rounded-xl p-5 shadow-sm text-center">
            <h3 className="text-lg font-bold text-text-main flex justify-center items-center gap-2 mb-4">
              <Clock size={20} className="text-text-muted" />
              Daily Timer
            </h3>
            <div className="text-4xl font-black text-text-main tracking-tight mb-6">
              {formatTime(sessionTime)}
            </div>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                isTimerRunning 
                  ? 'bg-danger text-bg-root hover:bg-danger/90' 
                  : 'bg-success text-bg-root hover:bg-success/90'
              }`}
            >
              {isTimerRunning ? <><Square size={18} fill="currentColor" /> Stop Timer</> : <><Play size={18} fill="currentColor" /> Start Timer</>}
            </button>
          </div>

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
              <button
                type="submit"
                className="w-full bg-accent text-bg-root font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                Submit Standup
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
