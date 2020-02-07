import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import React from 'react'

import { ReactComponent as ErrorIcon } from 'src/styling/icons/warning-icon/tomato.svg'
import { errorColor } from 'src/styling/variables'

import { Info3 } from './typography'

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    '& > svg': {
      marginRight: 10
    }
  },
  message: {
    display: 'flex',
    alignItems: 'center',
    color: errorColor,
    margin: 0,
    whiteSpace: 'break-spaces'
  }
}

const useStyles = makeStyles(styles)

const ErrorMessage = ({ className, children, ...props }) => {
  const classes = useStyles()

  return (
    <div className={classnames(classes.wrapper, className)}>
      <ErrorIcon />
      <Info3 className={classes.message}>{children}</Info3>
    </div>
  )
}

export default ErrorMessage
