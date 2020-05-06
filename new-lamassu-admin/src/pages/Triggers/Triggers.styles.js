import { booleanPropertiesTableStyles } from 'src/components/booleanPropertiesTable/BooleanPropertiesTable.styles'
import baseStyles from 'src/pages/Logs.styles'

const { titleWrapper, titleAndButtonsContainer, buttonsWrapper } = baseStyles
const { rowWrapper, radioButtons } = booleanPropertiesTableStyles

const mainStyles = {
  titleWrapper,
  titleAndButtonsContainer,
  buttonsWrapper,
  rowWrapper,
  radioButtons,
  radioGroup: {
    flexDirection: 'row'
  },
  radioLabel: {
    width: 150,
    height: 40
  },
  radio: {
    padding: 4,
    margin: 4
  },
  closeButton: {
    position: 'absolute',
    width: 16,
    height: 16,
    top: 20,
    right: 0
  },
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
  wizardHeaderText: {
    display: 'flex',
    margin: [[24, 0]]
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
