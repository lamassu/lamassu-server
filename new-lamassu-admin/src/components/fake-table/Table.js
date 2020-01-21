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
  tableDoubleHeaderHeight,
  offColor
} from 'src/styling/variables'
import typographyStyles from 'src/components/typography/styles'

const { tl2, p, label1 } = typographyStyles

const useStyles = makeStyles({
  body: {
    borderSpacing: [[0, 4]]
  },
  header: {
    extend: tl2,
    backgroundColor: tableHeaderColor,
    height: tableHeaderHeight,
    textAlign: 'left',
    color: white,
    display: 'flex',
    alignItems: 'center'
  },
  doubleHeader: {
    extend: tl2,
    backgroundColor: tableHeaderColor,
    height: tableDoubleHeaderHeight,
    color: white,
    display: 'table-row'
  },
  thDoubleLevel: {
    padding: [[0, spacer * 2]],
    display: 'table-cell',
    '& > :first-child': {
      extend: label1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: offColor,
      color: white,
      borderRadius: [[0, 0, 8, 8]],
      height: 28
    },
    '& > :last-child': {
      display: 'table-cell',
      verticalAlign: 'middle',
      height: tableDoubleHeaderHeight - 28,
      '& > div': {
        display: 'inline-block'
      }
    }
  },
  cellDoubleLevel: {
    display: 'flex',
    padding: [[0, spacer * 2]]
  },
  td: {
    padding: [[0, spacer * 3]]
  },
  tdHeader: {
    verticalAlign: 'middle',
    display: 'table-cell',
    padding: [[0, spacer * 3]]
  },
  trError: {
    backgroundColor: tableErrorColor
  },
  mainContent: {
    display: 'flex',
    alignItems: 'center',
    minHeight: 54
  },
  // mui-overrides
  cardContentRoot: {
    // display: 'flex',
    margin: 0,
    padding: 0,
    '&:last-child': {
      padding: 0
    }
  },
  card: {
    extend: p,
    '&:before': {
      height: 0
    },
    margin: [[4, 0]],
    width: '100%',
    boxShadow: [[0, 0, 4, 0, 'rgba(0, 0, 0, 0.08)']]
  },
  actionCol: {
    marginLeft: 'auto'
  }
})

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
  const classes = useStyles()
  return <div className={classnames(className, classes.body)}>{children}</div>
}

const Td = ({ children, header, className, size = 100, textAlign, action }) => {
  const classes = useStyles()
  const classNames = {
    [classes.td]: true,
    [classes.tdHeader]: header,
    [classes.actionCol]: action
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
    [classes.trError]: error
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
