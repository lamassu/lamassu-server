import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React from 'react'

import styles from './CustomerSidebar.styles.js'

const useStyles = makeStyles(styles)

const CustomerSidebar = ({ isSelected, onClick }) => {
  const classes = useStyles()
  const sideBarOptions = [
    {
      code: 'overview',
      display: 'Overview'
    },
    {
      code: 'customerData',
      display: 'Customer Data'
    }
  ]

  return (
    <div className={classes.sidebar}>
      {sideBarOptions?.map(it => (
        <div
          className={classnames({
            [classes.activeLink]: isSelected(it),
            [classes.link]: true
          })}
          onClick={() => onClick(it)}>
          {it.display}
        </div>
      ))}
    </div>
  )
}

export default CustomerSidebar
