const { ApolloError } = require('apollo-server-express')

class InvalidCredentialsError extends ApolloError {
  constructor(message) {
    super(message, 'INVALID_CREDENTIALS')
    Object.defineProperty(this, 'name', { value: 'InvalidCredentialsError' })
  }
}

class UserAlreadyExistsError extends ApolloError {
  constructor(message) {
    super(message, 'USER_ALREADY_EXISTS')
    Object.defineProperty(this, 'name', { value: 'UserAlreadyExistsError' })
  }
}

class InvalidTwoFactorError extends ApolloError {
  constructor(message) {
    super(message, 'INVALID_TWO_FACTOR_CODE')
    Object.defineProperty(this, 'name', { value: 'InvalidTwoFactorError' })
  }
}

class InvalidUrlError extends ApolloError {
  constructor(message) {
    super(message, 'INVALID_URL_TOKEN')
    Object.defineProperty(this, 'name', { value: 'InvalidUrlError' })
  }
}

module.exports = {
  InvalidCredentialsError,
  UserAlreadyExistsError,
  InvalidTwoFactorError,
  InvalidUrlError
}
