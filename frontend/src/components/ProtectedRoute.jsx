import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LOGIN_ROUTES = {
  citizen: '/login',
  officer: '/officer/login',
  admin:   '/admin/login',
};

const DASHBOARD_ROUTES = {
  citizen: '/citizen/dashboard',
  officer: '/officer/dashboard',
  admin:   '/admin/dashboard',
};

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // ── 1. Wait for rehydration from localStorage to complete ─────────────
  // Without this, token is null on first render even if user is logged in,
  // causing an instant redirect to /login before localStorage is read.
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // ── 2. Not logged in at all ────────────────────────────────────────────
  if (!isAuthenticated) {
    if (allowedRoles && allowedRoles.length === 1) {
      return <Navigate to={LOGIN_ROUTES[allowedRoles[0]] ?? '/login'} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // ── 3. Logged in but wrong role ────────────────────────────────────────
  // Normalise role: backend may return "admin", "ADMIN", "Admin", etc.
  if (allowedRoles && allowedRoles.length > 0 && user?.role) {
    const userRole = user.role.toLowerCase().trim();
    const allowed  = allowedRoles.map((r) => r.toLowerCase().trim());

    if (!allowed.includes(userRole)) {
      return <Navigate to={DASHBOARD_ROUTES[userRole] ?? '/'} replace />;
    }
  }

  // ── 4. All good ────────────────────────────────────────────────────────
  return children;
};