import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getRoleBasePath } from '../common/roleConfig';

function RoleProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  const location = useLocation();
  const pathname = location.pathname;

  if (!isAuthenticated) {
    const isHo = pathname.startsWith('/ho');
    return <Navigate to={isHo ? '/login/ho' : '/login/store'} replace state={{ from: location }} />;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const isAllowed = roles.includes(role);

  if (!isAllowed) {
    const correctBase = getRoleBasePath(role);
    return <Navigate to={correctBase} replace />;
  }

  return children ? children : <Outlet />;
}

export default RoleProtectedRoute;
