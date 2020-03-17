import baseStyles from 'src/pages/Logs.styles'
import { booleanPropertiesTableStyles } from 'src/components/booleanPropertiesTable/BooleanPropertiesTable.styles'

const { button } = baseStyles
const { rowWrapper } = booleanPropertiesTableStyles

const mainStyles = {
  button,
  content: {
    display: 'flex',
    justifyContent: 'space-between'
  },
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
  popoverContent: {
    width: 272,
    padding: [[10, 15]]
  }
}

export { mainStyles }
