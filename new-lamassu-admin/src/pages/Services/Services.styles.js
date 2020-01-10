import { white, offColor, errorColor } from 'src/styling/variables'
import typographyStyles from 'src/components/typography/styles'
import baseStyles from 'src/pages/Logs.styles'

const { titleWrapper } = baseStyles
const { label1, p } = typographyStyles

const servicesStyles = {
  titleWrapper,
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  addServiceMenu: {
    width: 215,
    '& > ul': {
      padding: [[18, 16, 21, 16]],
      '& > li': {
        display: 'flex',
        justifyContent: 'space-between',
        listStyle: 'none',
        marginBottom: 23,
        cursor: 'pointer',
        '& > span:first-child': {
          extend: p,
          fontWeight: 'bold'
        },
        '& > span:last-child': {
          extend: label1,
          color: offColor
        },
        '&:last-child': {
          marginBottom: 0
        }
      }
    }
  },
  mainWrapper: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& > div': {
      outline: 'none'
    }
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    '& button': {
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer'
    }
  },
  modalBody: {
    '& > form': {
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      minHeight: 400,
      '& > div:last-child': {
        display: 'flex',
        alignItems: 'flex-end',
        flex: 'auto',
        alignSelf: 'flex-end',
        '& > button': {
          marginTop: 32
        }
      }
    }
  },
  paper: {
    position: 'absolute',
    backgroundColor: white,
    outline: '0 none',
    padding: [[16, 20, 32, 24]]
  },
  inputField: {
    width: 434
  },
  formLabel: {
    extend: label1
  }
}

const editServiceStyles = {
  paper: {
    padding: [[5, 20, 32, 24]],
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 524,
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
  formBody: {
    display: 'flex',
    flexDirection: 'column'
  },
  field: {
    position: 'relative',
    '& > div': {
      width: 434
    }
  },
  submitWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    flexGrow: 2,
    marginTop: 32,
    '& > div': {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      justifyContent: 'flex-end',
      '& > button': {
        '&:active': {
          marginTop: 0
        }
      }
    }
  },
  submitError: {
    '& > div': {
      justifyContent: 'space-between'
    }
  },
  messageWrapper: {
    '& > div': {
      display: 'flex',
      alignItems: 'center',
      '& > svg': {
        marginRight: 10
      }
    }
  },
  message: {
    display: 'flex',
    alignItems: 'center',
    color: errorColor,
    margin: 0,
    whiteSpace: 'break-spaces',
    width: 250
  }
}

export { servicesStyles, editServiceStyles }
