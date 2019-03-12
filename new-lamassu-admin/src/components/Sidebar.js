import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'

import styles from './Sidebar.styles'

const useStyles = makeStyles(styles)

const Logs = ({ data, displayName, isSelected, onClick, children }) => {
  const classes = useStyles()
  return (
    <div className={classes.sidebar}>
      {data &&
        data.map((it, idx) => (
          <p
            key={idx}
            className={classnames(isSelected(it) ? classes.activeLink : '', classes.link)}
            onClick={() => onClick(it)}
          >
            {displayName(it)}
          </p>
        ))}
      {children}
    </div>
  )
}

export default Logs
