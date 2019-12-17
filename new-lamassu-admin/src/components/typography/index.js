import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React from 'react'

import styles from './styles'

const useStyles = makeStyles(styles)

function H1({ children, className, ...props }) {
  const classes = useStyles()
  return (
    <h1 className={classnames(classes.h1, className)} {...props}>
      {children}
    </h1>
  )
}

function H2({ children, className, ...props }) {
  const classes = useStyles()
  return (
    <h2 className={classnames(classes.h2, className)} {...props}>
      {children}
    </h2>
  )
}

function H3({ children, className, ...props }) {
  const classes = useStyles()
  return (
    <h3 className={classnames(classes.h3, className)} {...props}>
      {children}
    </h3>
  )
}

function H4({ children, className, ...props }) {
  const classes = useStyles()
  return (
    <h4 className={classnames(classes.h3, className)} {...props}>
      {children}
    </h4>
  )
}

const P = pBuilder('p')
const Info1 = pBuilder('info1')
const Info2 = pBuilder('info2')
const Info3 = pBuilder('info3')
const Mono = pBuilder('mono')
const TL1 = pBuilder('tl1')
const TL2 = pBuilder('tl2')
const Label1 = pBuilder('label1')
const Label2 = pBuilder('label2')
const Label3 = pBuilder('label3')

function pBuilder(elementClass) {
  return ({ inline, noMargin, className, children, ...props }) => {
    const classes = useStyles()
    const classNames = {
      [classes[elementClass]]: elementClass,
      className: true,
      [classes.inline]: inline,
      [classes.noMarginP]: noMargin,
    }
    return (
      <p className={classnames(classNames, className)} {...props}>
        {children}
      </p>
    )
  }
}

export {
  H1,
  H2,
  H3,
  H4,
  TL1,
  TL2,
  P,
  Info1,
  Info2,
  Info3,
  Mono,
  Label1,
  Label2,
  Label3,
}
