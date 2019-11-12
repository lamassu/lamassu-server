import {
  tableHeaderColor,
  tableHeaderHeight,
  spacer,
  white
} from '../styling/variables'

import typographyStyles from './typography/styles'

const { label2 } = typographyStyles

export default {
  tableBody: {
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
  }
}
