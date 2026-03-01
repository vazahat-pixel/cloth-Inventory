const MOCK_USERS = [
  {
    id: 1,
    name: 'ERP Admin',
    email: 'admin@clotherp.com',
    password: 'password123',
    role: 'Admin',
  },
  {
    id: 2,
    name: 'Store Manager',
    email: 'manager@clotherp.com',
    password: 'password123',
    role: 'Manager',
  },
  {
    id: 3,
    name: 'Store Staff',
    email: 'staff@clotherp.com',
    password: 'password123',
    role: 'Staff',
  },
];

export const login = ({ email, password }) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const normalizedEmail = email.trim().toLowerCase();

      const matchedUser = MOCK_USERS.find(
        (user) => user.email === normalizedEmail && user.password === password,
      );

      if (!matchedUser) {
        reject(new Error('Invalid credentials. Use one of the mock users.'));
        return;
      }

      const user = {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
      };
      const token = `mock-jwt-${matchedUser.role.toLowerCase()}-${Date.now()}`;

      resolve({ token, user });
    }, 800);
  });

const authService = { login };

export default authService;
