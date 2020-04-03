import baseStyles from 'src/pages/Logs.styles'
import { booleanPropertiesTableStyles } from 'src/components/booleanPropertiesTable/BooleanPropertiesTable.styles'
import { disabledColor, secondaryColor } from 'src/styling/variables'

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
  },
  radioGroupWrapper: {
    marginBottom: 46
  },
  textInput: {
    width: 96,
    height: 40,
    marginRight: 8
  },
  wizardStepsWrapper: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    flex: 'wrap',
    marginTop: 8,
    marginBottom: 10
  },
  unreachedStep: {
    width: 24,
    height: 24,
    border: `solid 2px ${disabledColor}`,
    borderRadius: '50%'
  },
  currentStep: {
    display: 'block',
    width: 24,
    height: 24,
    borderRadius: '100%',
    backgroundColor: secondaryColor,
    border: `2px solid ${secondaryColor}`,
    backgroundClip: 'content-box',
    padding: 4
  },
  completedStepCircle: {
    width: 24,
    height: 24,
    border: `solid 2px ${secondaryColor}`,
    borderRadius: '50%'
  },
  completedStepCheck: {
    width: 6,
    height: 10,
    margin: '4px 7px',
    borderBottom: `3px solid ${secondaryColor}`,
    borderRight: `3px solid ${secondaryColor}`,
    transform: 'rotate(45deg)'
  },
  unreachedStepLine: {
    width: 24,
    height: 2,
    border: `solid 1px ${disabledColor}`
  },
  reachedStepLine: {
    width: 24,
    height: 2,
    border: `solid 1px ${secondaryColor}`
  }
}

export { mainStyles }
