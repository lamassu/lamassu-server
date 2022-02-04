import * as R from 'ramda'

const getCashOutStatus = it => {
  if (it.hasError === 'Operator cancel') return 'Cancelled'
  if (it.hasError) return 'Error'
  if (it.dispense) return 'Success'
  if (it.expired) return 'Expired'
  return 'Pending'
}

const getCashInStatus = it => {
  if (it.operatorCompleted) return 'Cancelled'
  if (it.hasError || it.batchError) return 'Error'
  if (it.sendConfirmed) return 'Sent'
  if (it.expired) return 'Expired'
  if (it.batched) return 'Batched'
  return 'Pending'
}

const getStatus = it => {
  if (it.txClass === 'cashOut') {
    return getCashOutStatus(it)
  }
  return getCashInStatus(it)
}

const getStatusDetails = it => {
  if (!R.isNil(it.hasError)) return it.hasError
  if (!R.isNil(it.batchError)) return `Batch error: ${it.batchError}`
  return null
}

const getStatusProperties = status => ({
  hasError: status === 'Error' || null,
  batchError: status === 'Error' || null,
  dispense: status === 'Success' || null,
  expired: status === 'Expired' || null,
  operatorCompleted: status === 'Cancelled' || null,
  sendConfirmed: status === 'Sent' || null
})

export { getStatus, getStatusProperties, getStatusDetails }
