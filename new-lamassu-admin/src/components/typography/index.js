import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core/styles'
import styles from './styles'

const useStyles = makeStyles(styles)

function H1 ({ children, className, ...props }) {
  const classes = useStyles()
  return <h1 className={classnames(classes.h1, className)} {...props}>{children}</h1>
}

function H2 ({ children, className, ...props }) {
  const classes = useStyles()
  return <h2 className={classnames(classes.h2, className)} {...props}>{children}</h2>
}

function H3 ({ children, className, ...props }) {
  const classes = useStyles()
  return <h3 className={classnames(classes.h3, className)} {...props}>{children}</h3>
}

function H4 ({ children, className, ...props }) {
  const classes = useStyles()
  return <h4 className={classnames(classes.h3, className)} {...props}>{children}</h4>
}

const P = pBuilder()
const Info1 = pBuilder('info1')
const Info2 = pBuilder('info2')
const Info3 = pBuilder('info3')
const Info4 = pBuilder('info4')
const Mono = pBuilder('mono')
const TL1 = pBuilder('tl1')
const TL2 = pBuilder('tl2')

function pBuilder (elementClass) {
  return ({ inline, className, children, ...props }) => {
    const classes = useStyles()
    const classNames = {
      [classes[elementClass]]: elementClass,
      className: true,
      [classes.inline]: inline
    }
    return (
      <p className={classnames(classNames, className)} {...props}>
        {children}
      </p>
    )
  }
}

export { H1, H2, H3, H4, TL1, TL2, P, Info1, Info2, Info3, Info4, Mono }
