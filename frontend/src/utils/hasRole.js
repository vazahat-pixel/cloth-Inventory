export const hasRole = (requiredRoles, currentRole) => {
  if (!requiredRoles) {
    return true;
  }

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  if (roles.length === 0) {
    return true;
  }

  return roles.includes(currentRole);
};

export default hasRole;
