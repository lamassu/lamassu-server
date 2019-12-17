import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React from 'react'

import { Link } from 'src/components/buttons'
import {
  tableHeaderColor,
  tableHeaderHeight,
  tableErrorColor,
  spacer,
  white,
} from 'src/styling/variables'
import typographyStyles from 'src/components/typography/styles'

const { tl2, p } = typographyStyles

const useStyles = makeStyles({
  body: {
    borderSpacing: '0 4px',
  },
  header: {
    extend: tl2,
    backgroundColor: tableHeaderColor,
    height: tableHeaderHeight,
    textAlign: 'left',
    color: white,
    // display: 'flex'
    display: 'table-row',
  },
  td: {
    padding: `0 ${spacer * 3}px`,
  },
  tdHeader: {
    verticalAlign: 'middle',
    display: 'table-cell',
    padding: `0 ${spacer * 3}px`,
  },
  trError: {
    backgroundColor: tableErrorColor,
  },
  mainContent: {
    display: 'flex',
    alignItems: 'center',
    minHeight: 54,
  },
  // mui-overrides
  cardContentRoot: {
    // display: 'flex',
    margin: 0,
    padding: 0,
    '&:last-child': {
      padding: 0,
    },
  },
  card: {
    extend: p,
    '&:before': {
      height: 0,
    },
    margin: '4px 0',
    width: 'min-content',
    boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.08)',
  },
})

const Table = ({ children, className, ...props }) => (
  <div className={classnames(className)} {...props}>
    {children}
  </div>
)

const THead = ({ children }) => {
  const classes = useStyles()
  return <div className={classes.header}>{children}</div>
}

const TBody = ({ children, className }) => {
  const classes = useStyles()
  return <div className={classnames(className, classes.body)}>{children}</div>
}

const Td = ({ children, header, className, size = 100, textAlign }) => {
  const classes = useStyles()
  const classNames = {
    [classes.td]: true,
    [classes.tdHeader]: header,
  }

  return (
    <div
      className={classnames(className, classNames)}
      style={{ width: size, textAlign }}>
      {children}
    </div>
  )
}

const Th = ({ children, ...props }) => {
  return (
    <Td header {...props}>
      {children}
    </Td>
  )
}

const Tr = ({ error, errorMessage, children, className }) => {
  const classes = useStyles()
  const cardClasses = { root: classes.cardContentRoot }
  const classNames = {
    [classes.trError]: error,
  }

  return (
    <>
      <Card className={classnames(classNames, classes.card, className)}>
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

export { Table, THead, TBody, Tr, Td, Th, EditCell }
