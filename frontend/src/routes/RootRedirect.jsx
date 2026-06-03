import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getRoleBasePath } from '../common/roleConfig';

function RootRedirect() {
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login/ho" replace />;
  }

  return <Navigate to={getRoleBasePath(role)} replace />;
}

export default RootRedirect;
