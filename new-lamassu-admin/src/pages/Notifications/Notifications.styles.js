import { offColor, primaryColor } from 'src/styling/variables'
import theme from 'src/styling/theme'

const localStyles = {
  section: {
    marginBottom: 41
  },
  sectionTitle: {
    color: offColor
  },
  button: {
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    height: '100%'
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
  defaults: {
    display: 'flex',
    height: 185,
    '& > div:first-child': {
      display: 'flex',
      width: 254,
      borderRight: [['solid', 2, primaryColor]]
    },
    '& > div:last-child': {
      display: 'flex',
      marginLeft: 56
    }
  },
  overrides: {
    '& > :first-child': {
      color: offColor
    }
  },
  eRowField: {
    justifyContent: 'center'
  },
  edit: {
    display: 'flex',
    justifyContent: 'flex-end',
    '& > :first-child': {
      marginRight: 31
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
    marginTop: 2
  }
}

export {
  localStyles,
  inputSectionStyles,
  fiatBalanceAlertsStyles,
  percentageAndNumericInputStyles,
  multiplePercentageInputStyles
}
