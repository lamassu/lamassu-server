import * as R from 'ramda'

const secretTest = secret => ({
  test(val) {
    if (R.isNil(secret) && R.isNil(val)) {
      return this.createError()
    }
    return true
  }
})

export default secretTest
