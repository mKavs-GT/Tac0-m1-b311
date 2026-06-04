import { motion } from 'framer-motion';
import RecentActivityPanel from './RecentActivityPanel';

export default function Logs() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-black tracking-tight text-text-main">System Audit Logs</h2>
        <p className="text-sm text-text-muted mt-1">Real-time stream of all system activities, authentication events, and team actions.</p>
      </div>
      <RecentActivityPanel />
    </div>
  );
}
