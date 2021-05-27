const getCashOutStatus = it => {
  if (it.hasError === 'Operator cancel') return 'Cancelled'
  if (it.hasError) return 'Error'
  if (it.dispense) return 'Success'
  if (it.expired) return 'Expired'
  return 'Pending'
}

const getCashInStatus = it => {
  if (it.operatorCompleted) return 'Cancelled'
  if (it.hasError) return 'Error'
  if (it.sendConfirmed) return 'Sent'
  if (it.expired) return 'Expired'
  return 'Pending'
}

const getStatus = it => {
  if (it.txClass === 'cashOut') {
    return getCashOutStatus(it)
  }
  return getCashInStatus(it)
}

const getStatusDetails = it => {
  return it.hasError ? it.hasError : null
}

const getStatusProperties = status => ({
  hasError: status === 'Error' || null,
  dispense: status === 'Success' || null,
  expired: status === 'Expired' || null,
  operatorCompleted: status === 'Cancelled' || null,
  sendConfirmed: status === 'Sent' || null
})

export { getStatus, getStatusProperties, getStatusDetails }
