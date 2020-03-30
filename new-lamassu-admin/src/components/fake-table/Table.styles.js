import typographyStyles from 'src/components/typography/styles'
import {
  tableHeaderColor,
  tableHeaderHeight,
  tableErrorColor,
  spacer,
  white,
  tableDoubleHeaderHeight,
  offColor
} from 'src/styling/variables'

const { tl1, info2, tl2, p, label1 } = typographyStyles

export default {
  body: {
    borderSpacing: [[0, 4]]
  },
  large: {
    extend: tl1
  },
  md: {
    extend: info2
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
}
