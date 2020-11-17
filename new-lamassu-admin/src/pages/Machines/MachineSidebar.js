import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import React from 'react'

const MachineSidebar = ({ data, getText, getKey, isSelected, selectItem }) => {
  return (
    <List style={{ height: 400, overflowY: 'auto' }}>
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

  /*   return data.map(item => <button key={getKey(item)}>{getText(item)}</button>) */
}

export default MachineSidebar
