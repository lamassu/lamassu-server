import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React from 'react'

import { Link } from 'src/components/buttons'

import styles from './Table.styles'

const useStyles = makeStyles(styles)

const Table = ({ children, className, ...props }) => (
  <div className={classnames(className)} {...props}>
    {children}
  </div>
)

const THead = ({ children, className }) => {
  const classes = useStyles()
  return <div className={classnames(className, classes.header)}>{children}</div>
}

const TDoubleLevelHead = ({ children, className }) => {
  const classes = useStyles()

  return (
    <div className={classnames(className, classes.doubleHeader)}>
      {children}
    </div>
  )
}

const TBody = ({ children, className }) => {
  return <div className={classnames(className)}>{children}</div>
}

const Td = ({
  children,
  header,
  className,
  width = 100,
  size,
  bold,
  textAlign,
  action
}) => {
  const classes = useStyles({ textAlign, width, size })
  const classNames = {
    [classes.td]: true,
    [classes.tdHeader]: header,
    [classes.actionCol]: action,
    [classes.size]: !header,
    [classes.bold]: !header && bold
  }

  return <div className={classnames(className, classNames)}>{children}</div>
}

const Th = ({ children, ...props }) => {
  return (
    <Td header {...props}>
      {children}
    </Td>
  )
}

const ThDoubleLevel = ({ title, children, className }) => {
  const classes = useStyles()

  return (
    <div className={classnames(className, classes.thDoubleLevel)}>
      <div>{title}</div>
      <div>{children}</div>
    </div>
  )
}

const CellDoubleLevel = ({ children, className }) => {
  const classes = useStyles()

  return (
    <div className={classnames(className, classes.cellDoubleLevel)}>
      {children}
    </div>
  )
}

const Tr = ({ error, errorMessage, children, className }) => {
  const classes = useStyles()
  const cardClasses = { root: classes.cardContentRoot }
  const classNames = {
    [classes.tr]: true,
    [classes.trError]: error,
    [classes.card]: true,
    className
  }

  return (
    <>
      <Card className={classnames(classNames, className)}>
        <CardContent classes={cardClasses}>
          <div className={classes.mainContent}>{children}</div>
          {error && <div className={classes.errorContent}>{errorMessage}</div>}
        </CardContent>
      </Card>
    </>
  )
}

const EditCell = ({ save, cancel }) => (
  <Td>
    <Link style={{ marginRight: '20px' }} color="secondary" onClick={cancel}>
      Cancel
    </Link>
    <Link color="primary" onClick={save}>
      Save
    </Link>
  </Td>
)

export {
  Table,
  THead,
  TDoubleLevelHead,
  TBody,
  Tr,
  Td,
  Th,
  ThDoubleLevel,
  CellDoubleLevel,
  EditCell
}
