import { offColor, primaryColor } from 'src/styling/variables'
import theme from 'src/styling/theme'

const localStyles = {
  section: {
    marginBottom: 41,
    '&:last-child': {
      marginBottom: 109
    }
  },
  sectionTitle: {
    color: offColor
  },
  button: {
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    height: '100%'
  },
  defaults: {
    display: 'flex',
    height: 185,
    '& > div:first-child': {
      display: 'flex',
      borderRight: [['solid', 1, primaryColor]]
    },
    '& > div:not(:first-child)': {
      display: 'flex',
      marginLeft: 56
    }
  },
  overrides: {
    '& > :first-child': {
      color: offColor
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
  }
}

const inputSectionStyles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    '& > *': {
      marginLeft: 20
    },
    '& > :first-child': {
      marginLeft: 0
    },
    '& > button': {
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      height: '100%'
    },
    '& > div': {
      padding: [[0, theme.spacing(1)]],
      lineHeight: 'normal'
    }
  },
  percentageDisplay: {
    position: 'relative',
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
  eRowField: {
    justifyContent: 'center'
  },
  edit: {
    display: 'flex',
    justifyContent: 'flex-end',
    '& > :first-child': {
      marginRight: 31
    }
  },
  cashInWrapper: {
    width: 254
  }
}

const cryptoBalanceAlertsStyles = {
  lowBalance: {
    width: 254
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
    marginTop: 2
  }
}

const fieldStyles = {
  field: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    height: 53,
    padding: 0,
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
