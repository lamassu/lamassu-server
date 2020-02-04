import { offColor, primaryColor } from 'src/styling/variables'
import theme from 'src/styling/theme'

const localStyles = {
  section: {
    marginBottom: 41,
    '&:last-child': {
      // marginBottom: 109
      marginBottom: 1009
    }
  },
  sectionTitle: {
    color: offColor,
    margin: [[8, 0, 16, 0]]
  },
  button: {
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    height: '100%'
  },
  defaults: {
    display: 'flex',
    '& > div': {
      display: 'flex',
      alignItems: 'center'
    },
    '& > div:first-child': {
      borderRight: [['solid', 1, primaryColor]]
    },
    '& > div:not(:first-child)': {
      marginLeft: 56
    }
  },
  overrides: {
    display: 'inline-block'
  },
  overridesTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    '& > :first-child': {
      color: offColor
    },
    '& > button': {
      height: '100%'
    }
  },
  displayValue: {
    display: 'flex',
    alignItems: 'baseline',
    '& > p:first-child': {
      margin: [[0, 4, 5, 0]]
    },
    '&> p:last-child': {
      margin: 0
    }
  },
  edit: {
    display: 'flex',
    justifyContent: 'flex-end',
    '& > :first-child': {
      marginRight: 16
    }
  },
  eRowField: {
    display: 'inline-block',
    height: '100%'
  }
}

const inputSectionStyles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 24,
    height: 26,
    '& > :first-child': {
      flexShrink: 2,
      margin: 0,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis'
    },
    '& button': {
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer'
    }
  },
  editButton: {
    marginLeft: 16
  },
  disabledButton: {
    padding: [[0, theme.spacing(1)]],
    lineHeight: 'normal',
    marginLeft: 16
  },
  editingButtons: {
    display: 'flex',
    marginLeft: 16,
    '& > :not(:last-child)': {
      marginRight: 20
    }
  },
  percentageDisplay: {
    position: '',
    width: 76,
    height: 118,
    border: [['solid', 4, primaryColor]],
    marginRight: 12,
    '& > div': {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      backgroundColor: primaryColor,
      transition: [['height', '0.5s']],
      transitionTimingFunction: 'ease-out'
    }
  }
}

const fiatBalanceAlertsStyles = {
  cashInWrapper: {
    width: 254
  },
  doubleLevelHead: {
    '& > div > div': {
      marginRight: 72
    }
  },
  doubleLevelRow: {
    '& > div': {
      marginRight: 72
    }
  },
  fbaDefaults: {
    '& > div': {
      height: 185
    }
  }
}

const cryptoBalanceAlertsStyles = {
  lowBalance: {
    width: 254,
    '& form': {
      width: 217
    }
  },
  cbaDefaults: {
    '& > div': {
      height: 135
    }
  }
}

const percentageAndNumericInputStyles = {
  body: {
    display: 'flex',
    alignItems: 'center'
  }
}

const multiplePercentageInputStyles = {
  body: {
    display: 'flex',
    '& > div': {
      display: 'flex'
    },
    '& > div:not(:last-child)': {
      marginRight: 43
    }
  },
  title: {
    margin: [[2, 0, 12, 0]]
  }
}

const fieldStyles = {
  field: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    height: 53,
    padding: 0,
    '& > div': {
      display: 'flex',
      alignItems: 'baseline',
      '& > p:first-child': {
        margin: [[0, 4, 5, 0]]
      },
      '&> p:last-child': {
        margin: [[0, 0, 0, 3]]
      }
    },
    '& .MuiInputBase-input': {
      width: 80
    }
  },
  label: {
    margin: 0
  },
  notEditing: {
    '& > div': {
      margin: [[5, 0, 0, 0]],
      '& > p:first-child': {
        height: 16
      }
    }
  },
  percentageInput: {
    '& > div': {
      '& .MuiInputBase-input': {
        width: 30
      }
    }
  }
}

export {
  localStyles,
  inputSectionStyles,
  fiatBalanceAlertsStyles,
  cryptoBalanceAlertsStyles,
  percentageAndNumericInputStyles,
  multiplePercentageInputStyles,
  fieldStyles
}
