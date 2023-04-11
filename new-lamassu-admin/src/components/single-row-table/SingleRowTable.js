import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import * as R from 'ramda'
import React from 'react'

import { IconButton } from 'src/components/buttons'
import {
  Table,
  THead,
  TBody,
  Td,
  Th,
  Tr
} from 'src/components/fake-table/Table'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/white.svg'
import { ReactComponent as InfoIcon } from 'src/styling/icons/warning-icon/comet.svg'

import { Switch } from '../inputs'
import { P } from '../typography'

import styles from './SingleRowTable.styles'

const useStyles = makeStyles(styles)

const SingleRowTable = ({
  width = 378,
  height = 128,
  title,
  items,
  enabled,
  onSwitchClick,
  onActionClick,
  className
}) => {
  const classes = useStyles({ width, height })

  const buttonIcon = {
    enabled: <EditIcon />,
    disabled: <DeleteIcon />
  }

  const headerClass = {
    enabled: null,
    disabled: classes.headerDisabled
  }

  const content = {
    enabled: (
      <Tr className={classes.tr}>
        <Td width={width}>
          {items && (
            <>
              {items[0] && (
                <div className={classes.itemWrapper}>
                  <div className={classes.label}>{items[0].label}</div>
                  <div className={classes.item}>
                    {Array.isArray(items[0].value)
                      ? R.map(
                          it => (
                            <>
                              {it}
                              <br />
                            </>
                          ),
                          items[0].value
                        )
                      : items[0].value}
                  </div>
                </div>
              )}
              {items[1] && (
                <div className={classes.itemWrapper}>
                  <div className={classes.label}>{items[1].label}</div>
                  <div className={classes.item}>
                    {Array.isArray(items[1].value)
                      ? R.map(
                          it => (
                            <>
                              {it}
                              <br />
                            </>
                          ),
                          items[1].value
                        )
                      : items[1].value}
                  </div>
                </div>
              )}
            </>
          )}
        </Td>
      </Tr>
    ),
    disabled: (
      <Tr className={classes.trDisabled}>
        <Td width={width}>
          <span className={classes.infoMessage}>
            <InfoIcon />
            <P>This service is not being used</P>
          </span>
        </Td>
      </Tr>
    )
  }

  return (
    <>
      <Table className={classnames(className, classes.table)}>
        <THead className={enabled ? headerClass.enabled : headerClass.disabled}>
          <Th className={classes.head}>
            <span className={classes.title}>
              {title}
              <Switch
                checked={enabled}
                value={enabled}
                onChange={onSwitchClick}
              />
            </span>
            <IconButton onClick={onActionClick} className={classes.button}>
              {enabled ? buttonIcon.enabled : buttonIcon.disabled}
            </IconButton>
          </Th>
        </THead>
        <TBody>{enabled ? content.enabled : content.disabled}</TBody>
      </Table>
    </>
  )
}

export default SingleRowTable
