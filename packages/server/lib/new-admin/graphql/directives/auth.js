const _ = require('lodash/fp')

const { SchemaDirectiveVisitor, AuthenticationError } = require('apollo-server-express')
const { defaultFieldResolver } = require('graphql')

class AuthDirective extends SchemaDirectiveVisitor {
  visitObject (type) {
    this.ensureFieldsWrapped(type)
    type._requiredAuthRole = this.args.requires
  }

  visitFieldDefinition (field, details) {
    this.ensureFieldsWrapped(details.objectType)
    field._requiredAuthRole = this.args.requires
  }

  ensureFieldsWrapped (objectType) {
    if (objectType._authFieldsWrapped) return
    objectType._authFieldsWrapped = true

    const fields = objectType.getFields()

    _.forEach(fieldName => {
      const field = fields[fieldName]
      const { resolve = defaultFieldResolver } = field

      field.resolve = function (root, args, context, info) {
        const requiredRoles = field._requiredAuthRole ? field._requiredAuthRole : objectType._requiredAuthRole
        if (!requiredRoles) return resolve.apply(this, [root, args, context, info])

        const user = context.req.session.user
        if (!user || !_.includes(_.upperCase(user.role), requiredRoles)) throw new AuthenticationError('You do not have permission to access this resource!')

        return resolve.apply(this, [root, args, context, info])
      }
    }, _.keys(fields))
  }
}

module.exports = AuthDirective
