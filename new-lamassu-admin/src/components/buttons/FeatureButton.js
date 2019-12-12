import React, { memo } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'

import baseButtonStyles from './BaseButton.styles'

const { baseButton, primary } = baseButtonStyles

const styles = {
  featureButton: {
    extend: baseButton,
    width: baseButton.height,
    borderRadius: baseButton.height / 2,
    display: 'flex'
  },
  primary,
  buttonIcon: {
    margin: 'auto',
    '& svg': {
      overflow: 'visible'
    }
  },
  buttonIconActive: {} // required to extend primary
}

const useStyles = makeStyles(styles)

const FeatureButton = memo(({ className, Icon, InverseIcon, ...props }) => {
  const classes = useStyles()

  const classNames = {
    [classes.featureButton]: true,
    [classes.primary]: true
  }

  return (
    <button className={classnames(classNames, className)} {...props}>
      {Icon && <div className={classes.buttonIcon}><Icon /></div>}
      {InverseIcon &&
        <div className={classnames(classes.buttonIcon, classes.buttonIconActive)}>
          <InverseIcon />
        </div>}
    </button>
  )
})

export default FeatureButton
