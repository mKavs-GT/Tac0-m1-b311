const isLocalEnv = ['localhost', '127.0.0.1'].includes(window.location.hostname) || 
                   /^192\.168\.\d+\.\d+$/.test(window.location.hostname) || 
                   /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(window.location.hostname) ||
                   /^10\.\d+\.\d+\.\d+$/.test(window.location.hostname);

export const API_BASE_URL = isLocalEnv
  ? '' // Use Vite proxy in development
  : 'https://mkavs-backend.onrender.com';

export const WS_URL = isLocalEnv
  ? `ws://${window.location.hostname}:3000/staff`
  : 'wss://mkavs-backend.onrender.com/staff';
export const authHeader = () => {
  const saved = localStorage.getItem('mkavs_admin_user');
  if (!saved) return {};
  try {
    const user = JSON.parse(saved);
    return { 'Authorization': `Bearer ${user.token}` };
  } catch (e) {
    return {};
  }
};
