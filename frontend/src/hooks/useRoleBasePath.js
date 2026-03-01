import { useLocation } from 'react-router-dom';
import { getRoleFromPath } from '../common/roleConfig';

export function useRoleBasePath() {
  const location = useLocation();
  const pathname = location.pathname;
  const role = getRoleFromPath(pathname);
  const basePath = role ? `/${role.toLowerCase()}` : '/admin';
  return basePath;
}

export default useRoleBasePath;
