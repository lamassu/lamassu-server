import { Grid } from '@material-ui/core'
import React from 'react'

import SingleRowTable from 'src/components/single-row-table/SingleRowTable'

const EnabledService = ({ service, setEditingSchema, getItems }) => {
  return (
    <Grid item key={service.code}>
      <SingleRowTable
        editMessage={'Configure ' + service.title}
        title={service.title}
        state="enabled"
        onActionClick={() => setEditingSchema(service)}
        items={getItems(service.code, service.elements)}
      />
    </Grid>
  )
}

const DisabledService = ({ service, setEditingSchema, getItems }) => {
  return (
    <Grid item key={service.code}>
      <SingleRowTable
        editMessage={'Configure ' + service.title}
        title={service.title}
        state="disabled"
        onActionClick={() => setEditingSchema(service)}
        items={getItems(service.code, service.elements)}
      />
    </Grid>
  )
}

export { EnabledService, DisabledService }
