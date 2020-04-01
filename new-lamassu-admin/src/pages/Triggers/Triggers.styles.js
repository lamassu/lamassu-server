import baseStyles from 'src/pages/Logs.styles'
import { booleanPropertiesTableStyles } from 'src/components/booleanPropertiesTable/BooleanPropertiesTable.styles'

const {
  titleWrapper,
  titleAndButtonsContainer,
  buttonsWrapper,
  button
} = baseStyles
const { rowWrapper, radioButtons } = booleanPropertiesTableStyles

const mainStyles = {
  titleWrapper,
  titleAndButtonsContainer,
  buttonsWrapper,
  button,
  rowWrapper,
  radioButtons,
  columnWrapper: {
    display: 'flex',
    flexDirection: 'column'
  },
  topLeftAligned: {
    alignSelf: 'flex-start'
  },
  bottomRightAligned: {
    alignSelf: 'flex-end',
    marginLeft: 'auto'
  },
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& > div': {
      outline: 'none'
    }
  },
  paper: {
    padding: [[5, 20, 32, 24]],
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: 520,
    height: 480,
    overflow: 'hidden',
    '& > button': {
      position: 'absolute',
      top: 16,
      right: 16,
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      '& svg': {
        width: 18
      }
    },
    '& form': {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 2
    }
  },
  modalHeader: {
    display: 'flex',
    marginBottom: 14
  },
  modalBody: {
    display: 'flex',
    flexGrow: 2
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
  popoverContent: {
    width: 272,
    padding: [[10, 15]]
  }
}

export { mainStyles }
