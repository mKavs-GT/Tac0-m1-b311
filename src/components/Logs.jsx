import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ActivityLogPage({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ userId: '', eventType: '', date: '' });

  const fetchLogs = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.eventType) queryParams.append('action', filters.eventType);
      if (filters.date) queryParams.append('date', filters.date);

      const res = await fetch(`${API_BASE_URL}/api/activity-logs?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
          <Activity size={24} className="text-accent" />
          System Activity Log
        </h2>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <select
              value={filters.eventType}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
              className="w-full bg-bg-surface border border-border-main rounded-lg pl-9 pr-3 py-2 text-sm text-text-main focus:border-accent focus:outline-none appearance-none"
            >
              <option value="">All Events</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="TASK_COMPLETED">Task Completed</option>
              <option value="CLOCK_IN">Clock In</option>
              <option value="CLOCK_OUT">Clock Out</option>
            </select>
          </div>
          <div className="relative flex-1 md:w-40">
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="w-full bg-bg-surface border border-border-main rounded-lg px-3 py-2 text-sm text-text-main focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-main rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No activity logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg-muted text-text-muted uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main text-text-main">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-bg-root transition-colors">
                    <td className="px-6 py-4 font-medium">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.user?.avatar ? (
                          <img src={log.user.avatar} alt="" className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                            {log.user?.name?.[0] || '?'}
                          </div>
                        )}
                        <span>{log.user?.name || log.userId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-bg-muted text-text-muted rounded-md text-xs font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted">{log.details || '-'}</td>
                    <td className="px-6 py-4 font-mono text-xs text-text-muted">{log.ipAddress || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
