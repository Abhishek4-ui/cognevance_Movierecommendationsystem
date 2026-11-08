import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

const safeGetStorage = (key) => {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
  } catch (e) {
    return null;
  }
};

const safeSetStorage = (key, val) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, val);
    }
  } catch (e) {}
};

const safeRemoveStorage = (key) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (e) {}
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = safeGetStorage('cineai_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = safeGetStorage('cineai_access_token');
    if (token) {
      authApi.getProfile()
        .then((res) => {
          if (res.data?.user) {
            setUser(res.data.user);
            safeSetStorage('cineai_user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          // Token invalid
          safeRemoveStorage('cineai_access_token');
          safeRemoveStorage('cineai_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.data?.tokens?.accessToken) {
      safeSetStorage('cineai_access_token', res.data.tokens.accessToken);
      safeSetStorage('cineai_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    if (res.data?.tokens?.accessToken) {
      safeSetStorage('cineai_access_token', res.data.tokens.accessToken);
      safeSetStorage('cineai_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return res.data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await authApi.verifyOtp({ email, otp });
    if (res.data?.user) {
      setUser(res.data.user);
      safeSetStorage('cineai_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network fail on logout
    }
    safeRemoveStorage('cineai_access_token');
    safeRemoveStorage('cineai_user');
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await authApi.getProfile();
      if (res.data?.user) {
        setUser(res.data.user);
        safeSetStorage('cineai_user', JSON.stringify(res.data.user));
      }
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
