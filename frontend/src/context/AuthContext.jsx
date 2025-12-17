import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Check if user is logged in on page load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // First, get the CSRF token (important for subsequent requests)
      await api.get('/csrf/');
      
      // Then check if we have an active session
      const response = await api.get('/auth-check/');
      if (response.data.isAuthenticated) {
        setUser({ username: response.data.username });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log("Not logged in");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 2. Login Function
  const login = async (username, password) => {
    try {
      await api.post('/login/', { username, password });
      await checkAuthStatus(); // Refresh state
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // 3. Logout Function
  const logout = async () => {
    try {
      await api.post('/logout/');
      setUser(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);