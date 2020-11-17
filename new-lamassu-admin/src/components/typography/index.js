import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React from 'react'

import styles from './styles'

const useStyles = makeStyles(styles)

function H1({ children, noMargin, className, ...props }) {
  const classes = useStyles()
  const classNames = {
    [classes.h1]: true,
    [classes.noMargin]: noMargin,
    [className]: !!className
  }

  return (
    <h1 className={classnames(classNames)} {...props}>
      {children}
    </h1>
  )
}

function H2({ children, noMargin, className, ...props }) {
  const classes = useStyles()
  const classNames = {
    [classes.h2]: true,
    [classes.noMargin]: noMargin,
    [className]: !!className
  }

  return (
    <h2 className={classnames(classNames)} {...props}>
      {children}
    </h2>
  )
}

function H3({ children, noMargin, className, ...props }) {
  const classes = useStyles()
  const classNames = {
    [classes.h3]: true,
    [classes.noMargin]: noMargin,
    [className]: !!className
  }

  return (
    <h3 className={classnames(classNames)} {...props}>
      {children}
    </h3>
  )
}

function H4({ children, noMargin, className, ...props }) {
  const classes = useStyles()
  const classNames = {
    [classes.h4]: true,
    [classes.noMargin]: noMargin,
    [className]: !!className
  }

  return (
    <h4 className={classnames(classNames)} {...props}>
      {children}
    </h4>
  )
}

function H5({ children, noMargin, className, ...props }) {
  const classes = useStyles()
  const classNames = {
    [classes.h5]: true,
    [classes.noMargin]: noMargin,
    [className]: !!className
  }

  return (
    <h5 className={classnames(classNames)} {...props}>
      {children}
    </h5>
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
const Label4 = pBuilder('regularLabel')

function pBuilder(elementClass) {
  return ({ inline, noMargin, className, children, ...props }) => {
    const classes = useStyles()
    const classNames = {
      [className]: !!className,
      [classes[elementClass]]: elementClass,
      [classes.inline]: inline,
      [classes.noMargin]: noMargin
    }
    return (
      <p className={classnames(classNames)} {...props}>
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
  H5,
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
  Label4
}
