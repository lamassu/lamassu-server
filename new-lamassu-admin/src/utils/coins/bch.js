const cashaddr = require('cashaddrjs')

function validate(address) {
  try {
    if (!address) throw new Error('No address supplied.')

    cashaddr.decode(address)
    // if either payload is invalid or payload and network don't match, cashaddrjs throws validationError
    return true
  } catch (err) {
    return false
  }
}

export default validate
