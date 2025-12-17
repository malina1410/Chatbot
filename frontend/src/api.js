import axios from 'axios';

// 1. Create a specialized Axios instance
const api = axios.create({
  baseURL: '/api', // This uses the proxy we just set up
  withCredentials: true, // CRITICAL: Allows sending/receiving cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Helper to get the CSRF Token from cookies
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// 3. Request Interceptor: Attach CSRF Token
api.interceptors.request.use((config) => {
  // Only attach for non-GET requests (POST, PUT, DELETE)
  if (config.method !== 'get') {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }
  return config;
}, (error) => Promise.reject(error));

// 4. Response Interceptor: Handle Errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 (Unauthorized), we might want to redirect to login later
    if (error.response && error.response.status === 401) {
      console.log("Unauthorized - User needs to login");
    }
    return Promise.reject(error);
  }
);

export default api;