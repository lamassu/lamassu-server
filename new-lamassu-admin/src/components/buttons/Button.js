import React, { memo } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'

import styles from './Button.styles'

const useStyles = makeStyles(styles)

const ActionButton = memo(({ size = 'lg', children, className, ...props }) => {
  const classes = useStyles({ size })
  return (
    <button className={classnames(classes.button, className)} {...props}>
      {children}
    </button>
  )
})

export default ActionButton
