const _ = require('lodash/fp')

const db = require('./db')

const getRolePermissions = role => {
  const sql = `SELECT system_permissions.name, system_permissions.description FROM system_permissions
    LEFT OUTER JOIN role_permissions ON role_permissions.permission_id = system_permissions.id
    LEFT OUTER JOIN user_roles ON user_roles.id = role_permissions.role_id
    WHERE user_roles.name = $1`

  return db.any(sql, [role])
}

const getAllRolesPermissions = () => {
  const sql = `SELECT role_permissions.role_id AS id, user_roles.name as name, array_agg(system_permissions.name) AS permissions FROM role_permissions
    LEFT OUTER JOIN user_roles ON user_roles.id = role_permissions.role_id
    LEFT OUTER JOIN system_permissions ON role_permissions.permission_id = system_permissions.id
    GROUP BY role_permissions.role_id, user_roles.name`

  return db.any(sql)
}

const getUserPermissions = id => {
  const sql = `SELECT u.id, u.username, role.name AS role, role.permissions as permissions, u.enabled FROM users AS u
    LEFT OUTER JOIN (
      SELECT role_permissions.role_id AS id, user_roles.name as name, array_agg(system_permissions.name) AS permissions FROM role_permissions
        LEFT OUTER JOIN user_roles ON user_roles.id = role_permissions.role_id
        LEFT OUTER JOIN system_permissions ON role_permissions.permission_id = system_permissions.id
        GROUP BY role_permissions.role_id, user_roles.name
    ) AS role ON u.role_id = role.id
    WHERE u.id=$1 LIMIT 1`
  
  return db.oneOrNone(sql, [id])
}

const checkUserPermissions = (user, permissionsRequired) => {
  return getUserPermissions(user.id)
    .then(res => _.size(_.difference(permissionsRequired, res.permissions)) === 0)
    .catch(() => false)
}

module.exports = {
  getRolePermissions,
  getAllRolesPermissions,
  checkUserPermissions
}
