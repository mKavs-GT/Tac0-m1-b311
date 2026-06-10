import { auth } from '../firebase';

/**
 * apiFetch
 * A centralized wrapper around native fetch that dynamically fetches 
 * the Firebase ID token before each request to prevent auth/id-token-expired errors.
 */
export const apiFetch = async (url, options = {}) => {
  let token = null;
  if (auth.currentUser) {
    try {
      token = await auth.currentUser.getIdToken(false);
    } catch (e) {
      console.warn('apiFetch: Error getting token', e);
    }
  }

  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers
  };

  let response = await fetch(url, fetchOptions);

  if (response.status === 401) {
    console.warn('apiFetch: Received 401 Unauthorized, forcing token refresh and retrying...');
    if (auth.currentUser) {
      try {
        const freshToken = await auth.currentUser.getIdToken(true);
        headers['Authorization'] = `Bearer ${freshToken}`;
        
        // Update localStorage token just to keep the auth state synced for the rest of the app if needed
        try {
          const savedStr = localStorage.getItem('mkavs_admin_user');
          if (savedStr) {
            const savedUser = JSON.parse(savedStr);
            savedUser.token = freshToken;
            localStorage.setItem('mkavs_admin_user', JSON.stringify(savedUser));
          }
        } catch(e) {}

        response = await fetch(url, {
          ...options,
          headers
        });
      } catch (refreshErr) {
        console.error('apiFetch: Token refresh failed', refreshErr);
      }
    }
  }

  return response;
};
