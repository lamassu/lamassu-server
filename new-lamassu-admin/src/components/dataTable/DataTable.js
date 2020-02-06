import React, { memo } from 'react'
import {
  AutoSizer,
  List,
  CellMeasurer,
  CellMeasurerCache
} from 'react-virtualized'

import { THead, Th, Tr, Td } from 'src/components/fake-table/Table'
import { mainWidth } from 'src/styling/variables'

const DataTable = memo(({ elements, data }) => {
  const cache = new CellMeasurerCache({
    defaultHeight: 62,
    fixedWidth: true
  })

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
              height={height}
              width={mainWidth}
              rowCount={data.length}
              rowHeight={cache.rowHeight}
              rowRenderer={({ index, isScrolling, key, parent, style }) => (
                <CellMeasurer
                  cache={cache}
                  columnIndex={0}
                  key={key}
                  parent={parent}
                  rowIndex={index}>
                  <div style={style}>
                    <Tr
                      error={data[index].error}
                      errorMessage={data[index].errorMessage}>
                      {elements.map(
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
                            {view(data[index])}
                          </Td>
                        )
                      )}
                    </Tr>
                  </div>
                </CellMeasurer>
              )}
              overscanRowCount={50}
              deferredMeasurementCache={cache}
            />
          )}
        </AutoSizer>
      </div>
    </>
  )
})

export default DataTable
