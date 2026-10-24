import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('case_lens_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('case_lens_token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Set default authorization header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Verify and refresh user info on initial load
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('case_lens_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (res.data?.success && res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('case_lens_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.warn('Session expired or invalid token:', err.response?.data?.message || err.message);
        // If unauthorized, clear storage
        if (err.response?.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data?.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('case_lens_token', receivedToken);
        localStorage.setItem('case_lens_user', JSON.stringify(receivedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;
        return { success: true, user: receivedUser };
      }
      return { success: false, message: res.data?.message || 'Login failed' };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message };
    }
  };

  const register = async (fullName, email, password, role = 'user') => {
    try {
      const res = await axios.post('/api/auth/register', {
        fullName,
        email,
        password,
        role,
      });
      if (res.data?.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('case_lens_token', receivedToken);
        localStorage.setItem('case_lens_user', JSON.stringify(receivedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;
        return { success: true, user: receivedUser };
      }
      return { success: false, message: res.data?.message || 'Registration failed' };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('case_lens_token');
    localStorage.removeItem('case_lens_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem('case_lens_user', JSON.stringify(merged));
      return merged;
    });
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
