import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import React from 'react'

import Tooltip from 'src/components/Tooltip'
import { IconButton } from 'src/components/buttons'
import {
  Table,
  THead,
  TBody,
  Td,
  Th,
  Tr
} from 'src/components/fake-table/Table'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/white.svg'

import { P } from '../typography'

import styles from './SingleRowTable.styles'

const useStyles = makeStyles(styles)

const SingleRowTable = ({
  width = 378,
  height = 128,
  title,
  items,
  onEdit,
  className,
  editMessage
}) => {
  const classes = useStyles({ width, height })

  return (
    <>
      <Table className={classnames(className, classes.table)}>
        <THead>
          <Th className={classes.head}>
            {title}
            <Tooltip
              enableOver
              element={
                <IconButton onClick={onEdit} className={classes.button}>
                  <EditIcon />
                </IconButton>
              }>
              <P>{editMessage}</P>
            </Tooltip>
          </Th>
        </THead>
        <TBody>
          <Tr className={classes.tr}>
            <Td width={width}>
              {items && (
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
            </Td>
          </Tr>
        </TBody>
      </Table>
    </>
  )
}

export default SingleRowTable
