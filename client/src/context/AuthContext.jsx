import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const TOKEN_KEY = 'case_lens_token';
const USER_KEY = 'case_lens_user';

const FALLBACK_TOKEN_KEY = 'token';

const readStoredToken = () =>
  localStorage.getItem(TOKEN_KEY) || localStorage.getItem(FALLBACK_TOKEN_KEY);

const readStoredUser = () => {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const applyAuthHeader = (authToken) => {
  if (authToken) {
    axios.defaults.headers.common.Authorization = `Bearer ${authToken}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
};

// Global interceptor: always attach the latest stored token to every request.
axios.interceptors.request.use((config) => {
  const storedToken = readStoredToken();
  if (storedToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${storedToken}`;
  }
  return config;
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());
  const [token, setToken] = useState(() => {
    const storedToken = readStoredToken();
    applyAuthHeader(storedToken);
    return storedToken || null;
  });

  // ✅ FIX: Initialise loading=false immediately when a token already exists in
  // localStorage. This prevents ProtectedRoute from blocking navigation with a
  // "Loading session…" flash on every hard refresh or module navigation.
  const [loading, setLoading] = useState(!readStoredToken());

  useEffect(() => {
    const storedToken = readStoredToken();
    const storedUser = readStoredUser();

    if (storedToken) {
      setToken(storedToken);
      applyAuthHeader(storedToken);
    }
    if (storedUser) {
      setUser(storedUser);
    }

    // Always mark loading complete after the effect runs (covers the no-token case).
    setLoading(false);
  }, []);

  useEffect(() => {
    applyAuthHeader(token);
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data?.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem(TOKEN_KEY, receivedToken);
        localStorage.setItem(FALLBACK_TOKEN_KEY, receivedToken);
        localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
        applyAuthHeader(receivedToken);
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
      const res = await axios.post('/api/auth/register', { fullName, email, password, role });
      if (res.data?.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem(TOKEN_KEY, receivedToken);
        localStorage.setItem(FALLBACK_TOKEN_KEY, receivedToken);
        localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
        applyAuthHeader(receivedToken);
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
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(FALLBACK_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    applyAuthHeader(null);
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem(USER_KEY, JSON.stringify(merged));
      return merged;
    });
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token || readStoredToken()),
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
