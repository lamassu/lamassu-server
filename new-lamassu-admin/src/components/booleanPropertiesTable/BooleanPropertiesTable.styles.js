import baseStyles from 'src/pages/Logs.styles'
import { backgroundColor, zircon } from 'src/styling/variables'

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
      backgroundColor: backgroundColor
    },
    '&:nth-child(odd)': {
      backgroundColor: zircon
    },
    minHeight: 32,
    height: 'auto',
    padding: [[8, 16, 8, 24]],
    boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)'
  },
  leftTableCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'left',
    width: 200,
    padding: [0]
  },
  rightTableCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'right',
    padding: [0]
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
    display: 'flex',
    position: 'absolute',
    right: 0
  },
  radioButtons: {
    display: 'flex',
    flexDirection: 'row',
    margin: [-15]
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
