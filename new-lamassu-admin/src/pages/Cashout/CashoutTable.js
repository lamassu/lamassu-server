import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { useState } from 'react'

import {
  Th,
  Tr,
  Td,
  THead,
  TBody,
  Table
} from 'src/components/fake-table/Table'
import { Switch } from 'src/components/inputs'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { spacer } from 'src/styling/variables'

const styles = {
  expandButton: {
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: 4
  },
  row: {
    borderRadius: 0
  },
  link: {
    marginLeft: spacer
  }
}

const useStyles = makeStyles(styles)

const Row = ({
  id,
  elements,
  data,
  active,
  rowAction,
  onSave,
  handleEnable,
  ...props
}) => {
  const classes = useStyles()

  return (
    <Tr
      className={classnames(classes.row)}
      error={data.error}
      errorMessage={data.errorMessage}>
      {elements
        .slice(0, -2)
        .map(
          (
            { size, className, textAlign, view = it => it?.toString() },
            idx
          ) => (
            <Td
              key={idx}
              size={size}
              className={className}
              textAlign={textAlign}>
              {view({ ...data, editing: active })}
            </Td>
          )
        )}
      <Td
        size={elements[elements.length - 2].size}
        textAlign={elements[elements.length - 2].textAlign}>
        {data.cashOutDenominations && (
          <button
            onClick={() => rowAction(data)}
            className={classes.expandButton}>
            <EditIcon />
          </button>
        )}
      </Td>
      <Td
        size={elements[elements.length - 1].size}
        textAlign={elements[elements.length - 1].textAlign}>
        <Switch
          checked={data.cashOutDenominations}
          onChange={handleEnable(data)}
        />
      </Td>
    </Tr>
  )
}

/* rows = [{ columns = [{ name, value, className, textAlign, size }], details, className, error, errorMessage }]
 * Don't forget to include the size of the last (expand button) column!
 */
const CashOutTable = ({
  elements = [],
  data = [],
  Details,
  className,
  onSave,
  handleEditClick,
  handleEnable,
  ...props
}) => {
  const [active] = useState(null)

  return (
    <Table>
      <THead>
        {elements.map(({ size, className, textAlign, header }, idx) => (
          <Th key={idx} size={size} className={className} textAlign={textAlign}>
            {header}
          </Th>
        ))}
      </THead>

      <TBody>
        {data.map((it, idx) => (
          <Row
            id={idx}
            elements={elements}
            data={it}
            active={idx === active}
            rowAction={handleEditClick}
            onSave={onSave}
            handleEnable={handleEnable}
          />
        ))}
      </TBody>
    </Table>
  )
}

export default CashOutTable
