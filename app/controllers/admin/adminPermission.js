const roleRank = {
  admin: 2,
  subadmin: 1,
};

const canonicalRoleName = (role) => {
  if (!role || typeof role !== "string") return role;

  const normalized = role.trim().toLowerCase();

  switch (normalized) {
    case "subadmin":
      return "subadmin";

    case "admin":
      return "admin";

    default:
      return normalized;
  }
};

const normalizeRole = (role) => {
  if (!role || typeof role !== "string") return role;
  return role.trim().toLowerCase();
};

const hasPermission = (permission) => {
  return async (req, reply) => {
    try {
      const user = req.user;

      if (!user) {
        return reply.code(401).send({
          success: false,
          message: "Unauthorized",
        });
      }

      if (canonicalRoleName(user.role) === "admin") {
        return;
      }

      if (
        !Array.isArray(user.permissions) ||
        !user.permissions.includes(permission)
      ) {
        return reply.code(403).send({
          success: false,
          message: "Permission denied",
        });
      }
    } catch (error) {
      console.error("hasPermission error:", error);
      return reply.code(500).send({
        success: false,
        message: "Server error",
      });
    }
  };
};

const canManageRole = (loggedInRole, targetRole) => {
  const canonicalLoggedInRole = canonicalRoleName(loggedInRole);
  const canonicalTargetRole = canonicalRoleName(targetRole);

  if (!roleRank[canonicalLoggedInRole] || !roleRank[canonicalTargetRole]) {
    return false;
  }

  return roleRank[canonicalLoggedInRole] >= roleRank[canonicalTargetRole];
};

module.exports = {
  hasPermission,
  canManageRole,
  canonicalRoleName,
  normalizeRole,
  roleRank,
};