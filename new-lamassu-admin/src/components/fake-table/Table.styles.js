import typographyStyles from 'src/components/typography/styles'
import { bySize, bold } from 'src/styling/helpers'
import {
  tableHeaderColor,
  tableHeaderHeight,
  tableErrorColor,
  spacer,
  white,
  tableDoubleHeaderHeight,
  offColor,
  errorColor
} from 'src/styling/variables'

const { tl2, p, label1 } = typographyStyles

export default {
  size: ({ size }) => bySize(size),
  bold,
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
  thDoubleLevel: ({ width }) => ({
    width,
    display: 'table-cell',
    '& > :first-child': {
      margin: [[0, 10]],
      extend: label1,
      fontWeight: 700,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: offColor,
      color: white,
      borderRadius: [[0, 0, 8, 8]],
      height: 28
    },
    '& > :last-child': {
      padding: [[0, 11]],
      display: 'table-cell',
      verticalAlign: 'middle',
      height: tableDoubleHeaderHeight - 28
    }
  }),
  cellDoubleLevel: {
    display: 'flex',
    padding: [[0, spacer * 2]]
  },
  td: ({ textAlign, width }) => ({
    width,
    padding: [[1, spacer * 3, 0, spacer * 3]],
    textAlign
  }),
  tdHeader: {
    verticalAlign: 'middle',
    display: 'table-cell',
    padding: [[0, spacer * 3]]
  },
  trError: {
    backgroundColor: tableErrorColor
  },
  mainContent: ({ size }) => {
    const minHeight = size === 'lg' ? 68 : 48
    return {
      display: 'flex',
      alignItems: 'center',
      minHeight
    }
  },
  // mui-overrides
  cardContentRoot: {
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
    margin: [[4, 0, 0, 0]],
    width: '100%',
    boxShadow: [[0, 0, 4, 0, 'rgba(0, 0, 0, 0.08)']]
  },
  actionCol: {
    marginLeft: 'auto'
  },
  errorContent: {
    padding: [[12, 0, 12, 24]],
    color: errorColor
  }
}
