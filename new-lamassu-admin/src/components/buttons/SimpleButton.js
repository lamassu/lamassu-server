import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { memo } from 'react'

import baseButtonStyles from './BaseButton.styles'

const { baseButton, primary } = baseButtonStyles

const styles = {
  preventDefaultTooltip: {
    pointerEvents: 'none'
  },
  button: {
    extend: baseButton,
    borderRadius: baseButton.height / 2,
    outline: 0,
    padding: '0 20px'
  },
  primary,
  buttonIcon: {
    marginTop: 4,
    marginRight: 4,
    '& svg': {
      width: 20,
      height: 20,
      overflow: 'visible'
    }
  },
  buttonIconActive: {} // required to extend primary
}

const useStyles = makeStyles(styles)

const SimpleButton = memo(
  ({ className, Icon, InverseIcon, children, color, size, ...props }) => {
    const classes = useStyles()

    return (
      <button
        className={classnames(classes.primary, classes.button, className)}
        {...props}>
        {Icon && (
          <div className={classes.buttonIcon}>
            <Icon className={classes.preventDefaultTooltip} />
          </div>
        )}
        {InverseIcon && (
          <div
            className={classnames(
              classes.buttonIcon,
              classes.buttonIconActive
            )}>
            <InverseIcon />
          </div>
        )}
        {children}
      </button>
    )
  }
)

export default SimpleButton
