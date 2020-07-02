import baseStyles from 'src/pages/Logs.styles'

const { button } = baseStyles

const mainStyles = {
  button,
  content: {
    display: 'flex'
  },
  transparentButton: {
    '& > *': {
      margin: 'auto 10px'
    },
    '& button': {
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer'
    }
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    flex: 'wrap'
  },
  rowWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  rowTextAndSwitch: {
    display: 'flex',
    flex: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 285
  },
  popoverContent: {
    width: 272,
    padding: [[10, 15]]
  }
}

export { mainStyles }
