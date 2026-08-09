import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullScreenLoader } from '../components/ui';

export default function ProtectedRoute({ roles, children }) {
  const { user, booting } = useAuth();
  const location = useLocation();

  if (booting) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search, context: 'login' }} replace />;
  if (roles && !roles.includes(user.role)) {
    const home = user.role === 'staff' ? '/staff' : user.role === 'kitchen' ? '/kitchen' : user.role === 'admin' ? '/admin' : '/order-history';
    return <Navigate to={home} replace />;
  }
  return children;
}