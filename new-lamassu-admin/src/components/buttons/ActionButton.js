import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { memo } from 'react'

import styles from './ActionButton.styles'

const useStyles = makeStyles(styles)

const ActionButton = memo(
  ({ className, Icon, InverseIcon, color, children, disabled, ...props }) => {
    const classes = useStyles()
    const classNames = {
      [classes.actionButton]: true,
      [classes.disabled]: disabled,
      [classes.primary]: color === 'primary',
      [classes.secondary]: color === 'secondary',
      [classes.spring]: color === 'spring',
      [classes.tomato]: color === 'tomato'
    }

    return (
      <button
        disabled={disabled}
        className={classnames(classNames, className)}
        {...props}>
        {Icon && (
          <div className={classes.actionButtonIcon}>
            <Icon />
          </div>
        )}
        {InverseIcon && (
          <div
            className={classnames(
              classes.actionButtonIcon,
              classes.actionButtonIconActive
            )}>
            <InverseIcon />
          </div>
        )}
        {children && <div>{children}</div>}
      </button>
    )
  }
)

export default ActionButton
