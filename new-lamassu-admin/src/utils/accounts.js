import * as R from 'ramda'

const getAccountInstance = plugin => {
  if (!plugin) return

  const instances = plugin?.instances ?? []
  const activeInstances = R.filter(it => it.enabled, instances)

  if (R.isEmpty(activeInstances)) {
    throw new Error(
      `No active service configuration for plugin '${plugin?.code}'. Please check your 3rd party services options`
    )
  }

  if (R.length(activeInstances) > 1) {
    throw new Error(
      `Plugin '${plugin?.code}' has two or more active instances. Please make sure only a single instance is active at any given time`
    )
  }

  return activeInstances[0]
}

export { getAccountInstance }
