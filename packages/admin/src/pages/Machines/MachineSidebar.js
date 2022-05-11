import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { makeStyles } from '@material-ui/core/styles'
import React from 'react'

import styles from './Machines.styles'
const useStyles = makeStyles(styles)
const MachineSidebar = ({ data, getText, getKey, isSelected, selectItem }) => {
  const classes = useStyles()
  return (
    <List className={classes.sidebarContainer}>
      {data.map((item, idx) => {
        return (
          <ListItem
            disableRipple
            key={getKey(item) + idx}
            button
            selected={isSelected(getText(item))}
            onClick={() => selectItem(getText(item))}>
            <ListItemText primary={getText(item)} />
          </ListItem>
        )
      })}
    </List>
  )
}

export default MachineSidebar
