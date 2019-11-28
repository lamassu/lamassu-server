import React, { memo } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'

import styles from './ActionButton.styles'

const useStyles = makeStyles(styles)

const ActionButton = memo(({ className, Icon, InverseIcon, color, children, ...props }) => {
  const classes = useStyles({ color })
  const classNames = {
    [classes.actionButton]: true,
    [classes.primary]: color === 'primary',
    [classes.secondary]: color === 'secondary'
  }

  return (
    <button className={classnames(classNames, className)} {...props}>
      {Icon && <div className={classes.actionButtonIcon}><Icon /></div>}
      {InverseIcon &&
        <div className={classnames(classes.actionButtonIcon, classes.actionButtonIconActive)}>
          <InverseIcon />
        </div>}
      {children && <div>{children}</div>}
    </button>
  )
})

export default ActionButton
