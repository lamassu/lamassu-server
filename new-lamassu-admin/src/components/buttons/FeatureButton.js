import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { memo } from 'react'

import baseButtonStyles from './BaseButton.styles'

const { baseButton, primary } = baseButtonStyles

const styles = {
  featureButton: {
    extend: baseButton,
    width: baseButton.height,
    borderRadius: baseButton.height / 2,
    display: 'flex',
    padding: 0
  },
  primary,
  buttonIcon: {
    margin: 'auto',
    '& svg': {
      width: 16,
      height: 16,
      overflow: 'visible',
      '& g': {
        strokeWidth: 1.8
      }
    }
  },
  buttonIconActive: {} // required to extend primary
}

const useStyles = makeStyles(styles)

const FeatureButton = memo(
  ({ className, Icon, InverseIcon, children, ...props }) => {
    const classes = useStyles()

    const classNames = {
      [classes.featureButton]: true,
      [classes.primary]: true
    }

    return (
      <button className={classnames(classNames, className)} {...props}>
        {Icon && (
          <div className={classes.buttonIcon}>
            <Icon />
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

export default FeatureButton
