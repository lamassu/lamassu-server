import { Grid } from '@material-ui/core'
import React from 'react'

import SingleRowTable from 'src/components/single-row-table/SingleRowTable'

const EnabledService = ({
  account,
  service,
  setEditingSchema,
  getItems,
  disableService
}) => {
  console.log('account', account?.enabled)
  return (
    <Grid item key={service.code}>
      <SingleRowTable
        editMessage={'Configure ' + service.title}
        title={service.title}
        enabled={account?.enabled}
        onSwitchClick={() => disableService(service)}
        onActionClick={() => setEditingSchema(service)}
        items={getItems(service.code, service.elements)}
      />
    </Grid>
  )
}

const DisabledService = ({
  account,
  service,
  deleteAccount,
  getItems,
  enableService
}) => {
  console.log('account', account?.enabled)
  return (
    <Grid item key={service.code}>
      <SingleRowTable
        editMessage={'Configure ' + service.title}
        title={service.title}
        enabled={account?.enabled}
        onSwitchClick={() => enableService(service)}
        onActionClick={() =>
          deleteAccount({ variables: { accountId: service.code } })
        }
        items={getItems(service.code, service.elements)}
      />
    </Grid>
  )
}

export { EnabledService, DisabledService }
