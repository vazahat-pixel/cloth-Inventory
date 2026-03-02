import api from './api';

const login = async ({ email, password, role }) => {
  // 'admin' role (or no role at all = plain /login page) → admin endpoint
  // 'staff' or 'store_staff' → store endpoint
  const isStaff = role === 'staff' || role === 'store_staff';
  const endpoint = isStaff ? '/auth/store/login' : '/auth/admin/login';

  try {
    const response = await api.post(endpoint, { email, password });

    // Backend spreads data at top-level: { success, message, token, user }
    const { token, user } = response.data;

    // Map backend roles to frontend roles
    const rawRole = user?.role ?? '';
    const mappedRole = rawRole === 'admin' ? 'Admin' : rawRole === 'store_staff' ? 'Staff' : rawRole;
    const mappedUser = { ...user, role: mappedRole };

    return { token, user: mappedUser };
  } catch (error) {
    // Throw the error message for the frontend to display
    const message = error.response?.data?.message || error.message || 'Login failed. Please try again.';
    throw new Error(message);
  }
};

const authService = { login };

export default authService;
