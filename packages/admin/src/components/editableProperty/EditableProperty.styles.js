const optionsRowHeigth = 43

const editablePropertyStyles = {
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
    flex: 'wrap',
    height: optionsRowHeigth
  },
  rightAligned: {
    display: 'flex',
    position: 'absolute',
    right: 0
  },
  radioButtons: {
    display: 'flex',
    flexDirection: 'row',
    height: optionsRowHeigth
  },
  leftSpace: {
    marginLeft: '20px'
  }
}

export { editablePropertyStyles }
