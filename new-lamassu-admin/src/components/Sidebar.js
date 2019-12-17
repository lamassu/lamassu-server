import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React from 'react'

import styles from './Sidebar.styles'

const useStyles = makeStyles(styles)

const Logs = ({
  data,
  displayName,
  isSelected,
  onClick,
  children,
  itemRender,
}) => {
  const classes = useStyles()

  return (
    <div className={classes.sidebar}>
      {data &&
        data.map((it, idx) => (
          <div
            key={idx}
            className={classnames({
              [classes.activeLink]: isSelected(it),
              [classes.customRenderActiveLink]: itemRender && isSelected(it),
              [classes.customRenderLink]: itemRender,
              [classes.link]: true,
            })}
            onClick={() => onClick(it)}>
            {itemRender ? itemRender(it) : displayName(it)}
          </div>
        ))}
      {children}
    </div>
  )
}

export default Logs
