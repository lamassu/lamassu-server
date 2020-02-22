import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React, { useState } from 'react'
import {
  AutoSizer,
  List,
  CellMeasurer,
  CellMeasurerCache
} from 'react-virtualized'

import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { mainWidth, spacer } from 'src/styling/variables'
import { THead, Tr, Td, Th } from 'src/components/fake-table/Table'

import { Switch } from '../inputs'

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

const ActRow = ({
  id,
  elements,
  data,
  Details,
  active,
  rowAction,
  onSave,
  ...props
}) => {
  const classes = useStyles()

  return (
    <>
      <Tr
        className={classnames(classes.row)}
        error={data.error}
        errorMessage={data.errorMessage}>
        {elements
          .slice(0, -2)
          .map(
            (
              {
                header,
                size,
                className,
                textAlign,
                view = it => it?.toString()
              },
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
          {!active && data.cashOutDenominations && (
            <button
              onClick={() => rowAction(id)}
              className={classes.expandButton}>
              <EditIcon />
            </button>
          )}
        </Td>
        <Td
          size={elements[elements.length - 1].size}
          textAlign={elements[elements.length - 1].textAlign}>
          <Switch checked={data.cashOutDenominations} />
        </Td>
      </Tr>
    </>
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
  ...props
}) => {
  const [active, setActive] = useState(null)

  const rowAction = id => setActive(id === active ? null : id)

  const cache = new CellMeasurerCache({
    defaultHeight: 62,
    fixedWidth: true
  })

  function rowRenderer({ index, isScrolling, key, parent, style }) {
    return (
      <CellMeasurer
        cache={cache}
        columnIndex={0}
        key={key}
        parent={parent}
        rowIndex={index}>
        <div style={style}>
          <ActRow
            id={index}
            elements={elements}
            data={data[index]}
            Details={Details}
            active={index === active}
            rowAction={rowAction}
            onSave={onSave}
          />
        </div>
      </CellMeasurer>
    )
  }

  return (
    <>
      <div>
        <THead>
          {elements.map(({ size, className, textAlign, header }, idx) => (
            <Th
              key={idx}
              size={size}
              className={className}
              textAlign={textAlign}>
              {header}
            </Th>
          ))}
        </THead>
      </div>
      <div style={{ flex: '1 1 auto' }}>
        <AutoSizer disableWidth>
          {({ height }) => (
            <List
              {...props}
              height={height}
              width={mainWidth}
              rowCount={data.length}
              rowHeight={cache.rowHeight}
              rowRenderer={rowRenderer}
              overscanRowCount={50}
              deferredMeasurementCache={cache}
            />
          )}
        </AutoSizer>
      </div>
    </>
  )
}

export default CashOutTable
