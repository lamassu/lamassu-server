import baseStyles from 'src/pages/Logs.styles'
import { booleanPropertiesTableStyles } from 'src/components/booleanPropertiesTable/BooleanPropertiesTable.styles'

const { button } = baseStyles
const { rowWrapper, rightAligned } = booleanPropertiesTableStyles

const mainStyles = {
  button,
  transparentButton: {
    '& > *': {
      margin: 'auto 15px'
    },
    '& button': {
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer'
    }
  },
  rowWrapper,
  switchWrapper: {
    display: 'flex',
    marginLeft: 120
  },
  rightAligned,
  popoverContent: {
    width: 272,
    padding: [[10, 15]]
  }
}

export { mainStyles }
