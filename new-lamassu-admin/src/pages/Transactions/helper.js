const getCashOutStatus = it => {
  if (it.hasError) return 'Error'
  if (it.dispense) return 'Success'
  if (it.expired) return 'Expired'
  return 'Pending'
}

const getCashOutStatusDetails = it => {
  if (it.hasError) return it.hasError
  if (it.dispense) return ''
  if (it.expired) return ''
  return 'Pending'
}

const getCashInStatus = it => {
  if (it.operatorCompleted) return 'Cancelled'
  if (it.hasError) return 'Error'
  if (it.sendConfirmed) return 'Sent'
  if (it.expired) return 'Expired'
  return 'Pending'
}

const getCashInStatusDetails = it => {
  if (it.operatorCompleted) return ''
  if (it.hasError) return it.hasError
  if (it.sendConfirmed) return ''
  if (it.expired) return ''
  return 'Pending'
}

const getStatus = it => {
  if (it.txClass === 'cashOut') {
    return getCashOutStatus(it)
  }
  return getCashInStatus(it)
}

const getStatusDetails = it => {
  return it.txClass === 'cashOut'
    ? getCashOutStatusDetails(it)
    : getCashInStatusDetails(it)
}

export { getStatus, getStatusDetails }
