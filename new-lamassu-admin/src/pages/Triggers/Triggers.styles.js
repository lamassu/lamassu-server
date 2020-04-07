import baseStyles from 'src/pages/Logs.styles'
import { booleanPropertiesTableStyles } from 'src/components/booleanPropertiesTable/BooleanPropertiesTable.styles'

const { titleWrapper, titleAndButtonsContainer, buttonsWrapper } = baseStyles
const { rowWrapper, radioButtons } = booleanPropertiesTableStyles

const mainStyles = {
  titleWrapper,
  titleAndButtonsContainer,
  buttonsWrapper,
  rowWrapper,
  radioButtons,
  stepOneRadioButtons: {
    '& > *': {
      marginRight: 48
    }
  },
  stepTwoRadioButtons: {
    '& > *': {
      minWidth: 174,
      marginRight: 72
    }
  },
  stepThreeRadioButtons: {
    '& > *': {
      minWidth: 160,
      marginRight: 12
    }
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
  },
  radioGroupWrapper: {
    marginBottom: 46
  },
  textInput: {
    width: 96,
    height: 40,
    marginRight: 8
  }
}

export { mainStyles }
