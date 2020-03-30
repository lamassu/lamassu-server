import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import React from 'react'

import { Table, THead, TBody, Td, Th } from 'src/components/fake-table/Table'
import typographyStyles from 'src/components/typography/styles'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/white.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'
import {
  offColor,
  tableDisabledHeaderColor,
  tableNewDisabledHeaderColor,
  secondaryColorDarker
} from 'src/styling/variables'

const { label1, p } = typographyStyles

const SingleRowTable = ({
  width = 380,
  height = 160,
  title,
  items,
  onEdit,
  disabled,
  newService,
  className,
  ...props
}) => {
  const editButtonSize = 54

  const styles = {
    wrapper: {
      width: width,
      boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.08)'
    },
    buttonTh: {
      padding: [[0, 16]]
    },
    disabledHeader: {
      backgroundColor: tableDisabledHeaderColor,
      color: offColor
    },
    newDisabledHeader: {
      backgroundColor: tableNewDisabledHeaderColor
    },
    disabledBody: {
      extend: p,
      display: 'flex',
      alignItems: 'center',
      height: 104
    },
    itemWrapper: {
      display: 'flex',
      flexDirection: 'column',
      marginTop: 16,
      minHeight: 40,
      '& > div:last-child': {}
    },
    disabledWrapper: {
      display: 'flex',
      alignItems: 'center',
      '& > span:first-child': {
        display: 'flex'
      },
      '& > span:last-child': {
        paddingLeft: 16
      }
    },
    label: {
      extend: label1,
      color: offColor,
      marginBottom: 4
    },
    item: {
      extend: p
    },
    editButton: {
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      padding: 0
    },
    spanNew: {
      color: secondaryColorDarker,
      marginLeft: 12
    }
  }

  const useStyles = makeStyles(styles)

  const classes = useStyles()

  const headerClasses = {
    [classes.disabledHeader]: disabled,
    [classes.newDisabledHeader]: newService && disabled
  }

  const bodyClasses = {
    [classes.disabledBody]: disabled
  }

  return (
    <>
      {items && (
        <Table className={classnames(className, classes.wrapper)}>
          <THead className={classnames(headerClasses)}>
            <Th width={width - editButtonSize}>
              {title}
              {newService && <span className={classes.spanNew}>New</span>}
            </Th>
            <Th width={editButtonSize} className={classes.buttonTh}>
              {!disabled && (
                <button className={classes.editButton} onClick={onEdit}>
                  <EditIcon />
                </button>
              )}
              {disabled && (
                <button className={classes.editButton}>
                  <DeleteIcon />
                </button>
              )}
            </Th>
          </THead>
          <TBody className={classnames(bodyClasses)}>
            <Td width={width}>
              {!disabled && (
                <>
                  {items[0] && (
                    <div className={classes.itemWrapper}>
                      <div className={classes.label}>{items[0].label}</div>
                      <div className={classes.item}>{items[0].value}</div>
                    </div>
                  )}
                  {items[1] && (
                    <div className={classes.itemWrapper}>
                      <div className={classes.label}>{items[1].label}</div>
                      <div className={classes.item}>{items[1].value}</div>
                    </div>
                  )}
                </>
              )}
              {disabled && (
                <div className={classes.disabledWrapper}>
                  <span>
                    <WarningIcon />
                  </span>
                  <span>This service is not being used</span>
                </div>
              )}
            </Td>
          </TBody>
        </Table>
      )}
    </>
  )
}

export default SingleRowTable
