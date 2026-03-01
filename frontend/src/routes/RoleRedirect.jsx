import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getRoleBasePath } from '../common/roleConfig';

function RoleRedirect() {
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const basePath = getRoleBasePath(role);
  return <Navigate to={basePath} replace />;
}

export default RoleRedirect;
