import baseStyles from 'src/pages/Logs.styles'
import { tableCellColor, zircon } from 'src/styling/variables'

const { fillColumn } = baseStyles

const booleanPropertiesTableStyles = {
  booleanPropertiesTableWrapper: {
    display: 'flex',
    flexDirection: 'column',
    width: 396
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '&:nth-child(even)': {
      backgroundColor: tableCellColor
    },
    '&:nth-child(odd)': {
      backgroundColor: zircon
    },
    boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)'
  },
  tableCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 32,
    padding: [[5, 14, 5, 20]]
  },
  transparentButton: {
    '& > *': {
      margin: 'auto 12px'
    },
    '& button': {
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer'
    }
  },
  rowWrapper: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    flex: 'wrap'
  },
  rightAligned: {
    marginLeft: 'auto'
  },
  radioButtons: {
    display: 'flex',
    flexDirection: 'row',
    marginRight: -15
  },
  rightLink: {
    marginLeft: '20px'
  },
  fillColumn,
  popoverContent: {
    width: 272,
    padding: [[10, 15]]
  }
}

export { booleanPropertiesTableStyles }
