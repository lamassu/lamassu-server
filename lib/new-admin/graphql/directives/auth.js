const _ = require('lodash/fp')
const permissions = require('../../../system-permissions')

const { SchemaDirectiveVisitor, AuthenticationError } = require('apollo-server-express')
const { defaultFieldResolver } = require('graphql')

class AuthDirective extends SchemaDirectiveVisitor {
  visitObject (type) {
    this.ensureFieldsWrapped(type)
    type._requiredPermissions = this.args.permissions
  }

  visitFieldDefinition (field, details) {
    this.ensureFieldsWrapped(details.objectType)
    field._requiredPermissions = this.args.permissions
  }

  ensureFieldsWrapped (objectType) {
    if (objectType._authFieldsWrapped) return
    objectType._authFieldsWrapped = true

    const fields = objectType.getFields()

    _.forEach(fieldName => {
      const field = fields[fieldName]
      const { resolve = defaultFieldResolver } = field

      field.resolve = function (root, args, context, info) {
        const requiredPermissions = field._requiredPermissions ? field._requiredPermissions : objectType._requiredPermissions
        if (!requiredPermissions) return resolve.apply(this, [root, args, context, info])

        const user = context.req.session.user
        return permissions.checkUserPermissions(user, requiredPermissions)
          .then(authorized => {
            if (!authorized) throw new AuthenticationError('You do not have permission to access this resource!')
            return resolve.apply(this, [root, args, context, info])
          })
      }
    }, _.keys(fields))
  }
}

module.exports = AuthDirective
