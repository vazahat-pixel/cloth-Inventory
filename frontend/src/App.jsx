import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import { getMe } from './app/features/auth/authSlice';
import { prefetchCriticalRoutes } from './utils/routePrefetch';

function App() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const role = useSelector((state) => state.auth.role);

  useEffect(() => {
    if (token) {
      dispatch(getMe());
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (!token) return;
    const basePath = role?.toLowerCase().includes('staff') ? '/store' : '/ho';
    prefetchCriticalRoutes(basePath);
  }, [token, role]);

  return <AppRoutes />;
}

export default App;
