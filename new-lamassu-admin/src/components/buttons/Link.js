import React, { memo } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'

import styles from './Link.styles'

const useStyles = makeStyles(styles)

const Link = memo(({ submit, className, children, color, size, ...props }) => {
  const classes = useStyles()
  const classNames = {
    [classes.link]: true,
    [classes.primary]: color === 'primary',
    [classes.secondary]: color === 'secondary',
    [classes.noColor]: color === 'noColor'
  }

  return (
    <button
      type={submit ? 'submit' : 'button'}
      className={classnames(classNames, className)}
      {...props}
    >
      {children}
    </button>
  )
})

export default Link
