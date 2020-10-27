const getCashOutStatus = it => {
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

export { getStatus }
