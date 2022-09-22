import { Grid } from '@material-ui/core'
import React from 'react'

import SingleRowTable from 'src/components/single-row-table/SingleRowTable'

const EnabledService = ({
  account,
  schema,
  setEditingSchema,
  getItems,
  disableAccount
}) => {
  return (
    <Grid item key={account.id}>
      <SingleRowTable
        editMessage={'Configure ' + schema.name}
        title={`${schema.name} (${schema.category})`}
        enabled={account?.enabled}
        onSwitchClick={() => disableAccount(account)}
        onActionClick={() => setEditingSchema({ schema, account })}
        items={getItems(account.id, schema.code, schema.elements)}
      />
    </Grid>
  )
}

const DisabledService = ({
  account,
  schema,
  deleteAccount,
  getItems,
  enableAccount
}) => {
  return (
    <Grid item key={account.id}>
      <SingleRowTable
        editMessage={'Configure ' + schema.name}
        title={`${schema.name} (${schema.category})`}
        enabled={account?.enabled}
        onSwitchClick={() => enableAccount(account)}
        onActionClick={() =>
          deleteAccount({
            variables: { accountId: schema.code, instanceId: account.id }
          })
        }
        items={getItems(account.id, schema.code, schema.elements)}
      />
    </Grid>
  )
}

export { EnabledService, DisabledService }
