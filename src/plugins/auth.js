import useUserStore from '@/store/modules/user'

function authPermission(permission) {
  const all_permission = "*:*:*";
  const permissions = useUserStore().permissions
  if (permission && permission.length > 0) {
    return permissions.some(v => {
      return all_permission === v || v === permission
    })
  } else {
    return false
  }
}

function authRole(role) {
  const super_admin = "admin";
  const roles = useUserStore().roles
  if (role && role.length > 0) {
    return roles.some(v => {
      return super_admin === v || v === role
    })
  } else {
    return false
  }
}

export default {
  // Verify if the user has a certain permission
  hasPermi(permission) {
    return authPermission(permission);
  },
  // Verify if the user has any of the specified permissions
  hasPermiOr(permissions) {
    return permissions.some(item => {
      return authPermission(item)
    })
  },
  // Verify if the user has all of the specified permissions
  hasPermiAnd(permissions) {
    return permissions.every(item => {
      return authPermission(item)
    })
  },
  // Verify if the user has a certain role
  hasRole(role) {
    return authRole(role);
  },
  // Verify if the user has any of the specified roles
  hasRoleOr(roles) {
    return roles.some(item => {
      return authRole(item)
    })
  },
  // Verify if the user has all of the specified roles
  hasRoleAnd(roles) {
    return roles.every(item => {
      return authRole(item)
    })
  }
}
