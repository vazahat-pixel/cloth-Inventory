import { useLocation } from 'react-router-dom';
import { getRoleFromPath } from '../common/roleConfig';

export function useRoleBasePath() {
  const location = useLocation();
  const role = getRoleFromPath(location.pathname);
  if (role === 'admin') return '/ho';
  if (role === 'store_staff') return '/store';
  return '/ho'; // default fallback
}

export default useRoleBasePath;
