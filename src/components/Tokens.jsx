import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { Plus, Check, X, Clock } from 'lucide-react';

export default function Tokens({ user }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: 'LEAVE', date: '', reason: '', note: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchTokens();
  }, [user]);

  const fetchTokens = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tokens?userId=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
      }
    } catch (err) {
      console.error('Failed to fetch tokens', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId: user.uid })
      });
      if (res.ok) {
        setForm({ type: 'LEAVE', date: '', reason: '', note: '' });
        setShowForm(false);
        fetchTokens();
      }
    } catch (err) {
      console.error('Failed to submit token', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-text-main">My Tokens</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-accent text-bg-root px-4 py-2 rounded-lg font-bold hover:opacity-90"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'Request Token'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-bg-surface border border-border-main rounded-xl p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-main mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
                className="w-full bg-bg-root border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent text-text-main"
              >
                <option value="LEAVE">Leave</option>
                <option value="ATTENDANCE">Attendance Correction</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-main mb-1.5">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={e => setForm({...form, date: e.target.value})}
                className="w-full bg-bg-root border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent text-text-main"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-main mb-1.5">Reason</label>
            <input
              type="text"
              required
              value={form.reason}
              onChange={e => setForm({...form, reason: e.target.value})}
              className="w-full bg-bg-root border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent text-text-main"
              placeholder="Brief reason for the token"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-main mb-1.5">Additional Note (Optional)</label>
            <textarea
              value={form.note}
              onChange={e => setForm({...form, note: e.target.value})}
              className="w-full bg-bg-root border border-border-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent text-text-main"
              rows={2}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-text-main text-bg-surface px-6 py-2 rounded-lg font-bold disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-bg-surface border border-border-main rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading tokens...</div>
        ) : tokens.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No tokens requested yet.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-muted text-text-muted uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main text-text-main">
              {tokens.map(token => (
                <tr key={token.id} className="hover:bg-bg-root transition-colors">
                  <td className="px-6 py-4 font-medium">{new Date(token.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-bg-muted rounded text-xs font-bold">
                      {token.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">{token.reason}</td>
                  <td className="px-6 py-4">
                    {token.status === 'APPROVED' ? (
                      <span className="flex items-center gap-1 text-success font-bold text-xs"><Check size={14}/> APPROVED</span>
                    ) : token.status === 'REJECTED' ? (
                      <span className="flex items-center gap-1 text-danger font-bold text-xs"><X size={14}/> REJECTED</span>
                    ) : (
                      <span className="flex items-center gap-1 text-warning font-bold text-xs"><Clock size={14}/> PENDING</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
