import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import useRoleBasePath from './useRoleBasePath';

export function useAppNavigate() {
  const navigate = useNavigate();
  const basePath = useRoleBasePath();

  const appNavigate = useCallback(
    (to, options) => {
      if (typeof to === 'string' && to.startsWith('/') && !to.startsWith('/login')) {
        const targetPath = to === '/' ? basePath : `${basePath}${to}`;
        navigate(targetPath, options);
      } else {
        navigate(to, options);
      }
    },
    [navigate, basePath],
  );

  return appNavigate;
}

export default useAppNavigate;
