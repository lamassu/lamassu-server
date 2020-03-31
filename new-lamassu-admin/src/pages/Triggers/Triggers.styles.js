import baseStyles from 'src/pages/Logs.styles'

const { titleWrapper, titleAndButtonsContainer, buttonsWrapper } = baseStyles

const mainStyles = {
  titleWrapper,
  titleAndButtonsContainer,
  buttonsWrapper,
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
  }
}

export { mainStyles }
