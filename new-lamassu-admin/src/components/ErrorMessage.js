import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core'

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
    whiteSpace: 'break-spaces',
    width: 250
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
