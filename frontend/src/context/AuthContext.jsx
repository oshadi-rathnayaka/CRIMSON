import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext();

// ── Debug helper (visible in Chrome DevTools console) ──────────────────────
const log = (group, ...args) => {
  console.groupCollapsed(`%c[AuthContext] ${group}`, 'color:#E8192C;font-weight:bold');
  args.forEach(a => console.log(a));
  console.groupEnd();
};

const getApiErrorMessage = (err, fallbackMessage) => {
  if (!err) return fallbackMessage;

  const apiMessage = err.response?.data?.message;
  const validationErrors = err.response?.data?.errors;

  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    return validationErrors.join(', ');
  }

  if (apiMessage) return apiMessage;

  if (err.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }

  if (err.message === 'Network Error') {
    return 'Cannot reach server. Please check backend is running on port 5000.';
  }

  return err.message || fallbackMessage;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);   // true while rehydrating
  const [error, setError]     = useState(null);

  // ── Rehydrate from localStorage on first mount ──────────────────────────
  useEffect(() => {
    const rehydrate = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser  = localStorage.getItem('authUser');

        if (!storedToken || !storedUser) {
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsed);
        log('Rehydrate', 'Local session found for:', parsed.email);

        // Pick correct /me endpoint based on stored role
        const meEndpoint =
          parsed.role === 'officer' ? '/officer/auth/me' :
          parsed.role === 'admin'   ? '/admin/auth/me'   :
          '/auth/me';
        const response = await api.get(meEndpoint);
        const serverUser = response.data?.user;
        if (serverUser) {
          persistSession(storedToken, serverUser);
          log('Rehydrate', 'Session validated with server');
        }
      } catch (e) {
        console.warn('[AuthContext] Rehydrate failed, clearing session.', e?.message || e);
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    rehydrate();
  }, []);

  // ── Persist helpers ──────────────────────────────────────────────────────
  const persistSession = (tkn, usr) => {
    localStorage.setItem('authToken', tkn);
    localStorage.setItem('authUser', JSON.stringify(usr));
    setToken(tkn);
    setUser(usr);
  };

  const clearSession = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
  };

  // ── clearError (used by forms on input change) ───────────────────────────
  const clearError = useCallback(() => setError(null), []);

  // ── REGISTER ─────────────────────────────────────────────────────────────
  const register = async ({ fullName, email, password, confirmPassword, phone, district, nationalId }) => {
    setError(null);
    setLoading(true);
    log('Register → request', { fullName, email, phone, district, nationalId });

    try {
      const response = await api.post('/auth/register', {
        fullName,
        email,
        password,
        confirmPassword,
        phone,
        district,
        nationalId,
      });

      const data = response.data;
      log('Register ← response', { status: response.status, data });

      persistSession(data.token, data.user);
      log('Register ✅ success', data.user);
      return { success: true, data };

    } catch (err) {
      const msg = getApiErrorMessage(err, 'Registration failed. Please try again.');
      console.error('[AuthContext] Register error:', msg);
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // ── LOGIN ────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    log('Login → request', { email });

    try {
      const response = await api.post('/auth/login', { email, password });

      const data = response.data;
      log('Login ← response', { status: response.status, data });

      persistSession(data.token, data.user);
      log('Login ✅ success', data.user);
      return { success: true, data };

    } catch (err) {
      const msg = getApiErrorMessage(err, 'Login failed. Please try again.');
      console.error('[AuthContext] Login error:', msg);
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // ── ADMIN LOGIN ─────────────────────────────────────────────────────────
  const adminLogin = async (email, password) => {
    setError(null);
    setLoading(true);
    log('AdminLogin → request', { email });

    try {
      const response = await api.post('/admin/auth/login', { email, password });
      const data = response.data;
      log('AdminLogin ← response', { status: response.status, data });

      persistSession(data.token, data.user);
      log('AdminLogin ✅ success', data.user);
      return { success: true, data };
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Login failed. Please try again.');
      console.error('[AuthContext] AdminLogin error:', msg);
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // ── OFFICER LOGIN ───────────────────────────────────────────────────────────────
  const officerLogin = async (email, password, fullName, district) => {
    setError(null);
    setLoading(true);
    log('OfficerLogin → request', { email, fullName, district });

    try {
      const payload = { email, password, fullName, district };
      let response;

      try {
        response = await api.post('/officer/auth/login', payload, { timeout: 30000 });
      } catch (firstErr) {
        // Retry once for transient timeout/network spikes during login.
        if (firstErr?.code === 'ECONNABORTED') {
          log('OfficerLogin retry', 'First attempt timed out, retrying once');
          response = await api.post('/officer/auth/login', payload, { timeout: 30000 });
        } else {
          throw firstErr;
        }
      }

      const data = response.data;
      log('OfficerLogin ← response', { status: response.status, data });

      persistSession(data.token, data.user);
      log('OfficerLogin ✅ success', data.user);
      return { success: true, data };
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Login failed. Please try again.');
      console.error('[AuthContext] OfficerLogin error:', msg);
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // ── UPDATE USER (after profile/settings save) ───────────────────────────
  const updateUser = useCallback((updatedUser) => {
    const merged = { ...user, ...updatedUser };
    localStorage.setItem('authUser', JSON.stringify(merged));
    setUser(merged);
  }, [user]);

  // ── LOGOUT ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      log('Logout → request', 'Calling /auth/logout');
      await api.post('/auth/logout');
      log('Logout ← response', 'Server logout successful');
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Logout request failed');
      console.warn('[AuthContext] Logout warning:', msg);
    } finally {
      log('Logout', 'Clearing local session');
      clearSession();
      setError(null);
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    officerLogin,
    adminLogin,
    logout,
    updateUser,
    clearError,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
};
