import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getRoleBasePath } from '../common/roleConfig';

function PublicRoute({ children }) {
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to={getRoleBasePath(role)} replace />;
  }

  return children || <Outlet />;
}

export default PublicRoute;
