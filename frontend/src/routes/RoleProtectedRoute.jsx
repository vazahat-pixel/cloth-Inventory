import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getRoleBasePath, normalizePanelRole } from '../common/roleConfig';

function RoleProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  const location = useLocation();
  const pathname = location.pathname;

  if (!isAuthenticated) {
    const isHo = pathname.startsWith('/ho');
    return <Navigate to={isHo ? '/login/ho' : '/login/store'} replace state={{ from: location }} />;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const userPanelRole = normalizePanelRole(role);
  const isAllowed = roles.some((allowed) => normalizePanelRole(allowed) === userPanelRole);

  if (!isAllowed) {
    const userBase = getRoleBasePath(role);
    const loginTarget = pathname.startsWith('/store') ? '/login/store' : '/login/ho';
    if (!role || pathname.startsWith(userBase)) {
      return <Navigate to={loginTarget} replace />;
    }
    return <Navigate to={userBase} replace />;
  }

  return children ? children : <Outlet />;
}

export default RoleProtectedRoute;
