import React from 'react'
import classnames from 'classnames'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'

import { makeStyles } from '@material-ui/core/styles'

import { Link } from '../../components/buttons'

import {
  tableHeaderColor,
  tableHeaderHeight,
  spacer,
  white
} from '../../styling/variables'

import typographyStyles from '../typography/styles'

const { label2, p, info2 } = typographyStyles

const useStyles = makeStyles({
  body: {
    borderSpacing: '0 4px'
  },
  header: {
    extend: label2,
    backgroundColor: tableHeaderColor,
    height: tableHeaderHeight,
    textAlign: 'left',
    color: white,
    // display: 'flex'
    display: 'table-row'
  },
  td: {
    padding: `0 ${spacer * 3}px`
  },
  tdHeader: {
    verticalAlign: 'middle',
    display: 'table-cell',
    padding: `0 ${spacer * 3}px`
  },
  summary: {
    cursor: 'auto'
  },
  // mui-overrides
  panelRoot: {
    extend: p,
    display: 'table-row',
    '&:before': {
      height: 0
    },
    margin: '4px 0',
    boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.08)'
  },
  panelExpanded: {
    '&:first-child': {
      marginTop: '4px !important'
    }
  },
  summaryRoot: {
    userSelect: 'auto',
    '&:hover:not(.Mui-disabled)': {
      cursor: 'auto'
    },
    cursor: 'auto',
    padding: 0
  },
  summaryContent: {
    margin: 0,
    height: 54,
    alignItems: 'center'
  },
  summaryFocused: {
    backgroundColor: 'inherit !important'
  }
})

const Table = ({ children, className, ...props }) => (
  <div className={classnames(className)} {...props}>
    {children}
  </div>
)

const THead = ({ children }) => {
  const classes = useStyles()
  return (
    <div className={classes.header}>
      {children}
    </div>
  )
}

const TBody = ({ children, className }) => {
  const classes = useStyles()
  return (
    <div className={classnames(className, classes.body)}>
      {children}
    </div>
  )
}

const Td = ({ children, header, className, size = 100 }) => {
  const classes = useStyles()
  const classNames = {
    [classes.td]: true,
    [classes.tdHeader]: header
  }

  return (
    <div className={classnames(className, classNames)} style={{ width: size }}>
      {children}
    </div>
  )
}

const Tr = ({ children }) => {
  const classes = useStyles()
  const epClasses = { root: classes.panelRoot, expanded: classes.panelExpanded }
  const summaryClasses = { root: classes.summaryRoot, content: classes.summaryContent, focused: classes.summaryFocused }

  return (
    <ExpansionPanel expanded={false} classes={epClasses} square>
      <ExpansionPanelSummary tabIndex={null} classes={summaryClasses} className={classes.summary}>
        {children}
      </ExpansionPanelSummary>
    </ExpansionPanel>
  )
}

const EditCell = ({ save, cancel }) => (
  <Td>
    <Link style={{ marginRight: '20px' }} color='secondary' onClick={cancel}>
      Cancel
    </Link>
    <Link color='primary' onClick={save}>
      Save
    </Link>
  </Td>
)

export { Table, THead, TBody, Tr, Td, EditCell }
