import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import * as R from 'ramda'
import React from 'react'

const AlertsTable = ({ numToRender, alerts }) => {
  const alertsToRender = R.slice(0, numToRender, alerts)
  return (
    <List dense>
      {alertsToRender.map((alert, idx) => {
        return (
          <ListItem key={idx}>
            <ListItemText primary={alert.text} />
          </ListItem>
        )
      })}
    </List>
  )
}

export default AlertsTable
