import React, { memo } from 'react'
import classnames from 'classnames'

import baseButtonStyles from './BaseButton.styles'
import { makeStyles } from '@material-ui/core/styles'

const { baseButton } = baseButtonStyles

const styles = {
  button: {
    extend: baseButton,
    borderRadius: baseButton.height / 2,
    outline: 0,
    padding: '0 20px'
  }
}

const useStyles = makeStyles(styles)

const SimpleButton = memo(({ className, children, color, size, ...props }) => {
  const classes = useStyles()

  return (
    <button className={classnames(classes.button, className)} {...props}>
      {children}
    </button>
  )
})

export default SimpleButton
