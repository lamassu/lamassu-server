import typographyStyles from 'src/components/typography/styles'
import {
  white,
  subheaderColor,
  subheaderDarkColor,
  offColor,
  offDarkColor,
  offDarkerColor,
  secondaryColor,
  secondaryColorDark,
  secondaryColorDarker,
  errorColor,
  errorColorDark,
  errorColorDarker
} from 'src/styling/variables'

const { p } = typographyStyles

const colors = (color1, color2, color3) => {
  return {
    backgroundColor: color1,
    '&:hover': {
      backgroundColor: color2
    },
    '&:active': {
      backgroundColor: color3
    }
  }
}

export default {
  actionButton: {
    extend: p,
    cursor: 'pointer',
    border: 'none',
    height: 28,
    outline: 0,
    borderRadius: 6,
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center'
  },
  primary: {
    extend: colors(subheaderColor, subheaderDarkColor, offColor),
    '&:active': {
      color: white,
      '& $actionButtonIcon': {
        display: 'none'
      },
      '& $actionButtonIconActive': {
        display: 'flex'
      }
    },
    '& $actionButtonIconActive': {
      display: 'none'
    }
  },
  secondary: {
    extend: colors(offColor, offDarkColor, offDarkerColor),
    color: white,
    '&:active': {
      '& $actionButtonIcon': {
        display: 'flex'
      },
      '& $actionButtonIconActive': {
        display: 'none'
      }
    },
    '& $actionButtonIcon': {
      display: 'none'
    },
    '& $actionButtonIconActive': {
      display: 'flex'
    }
  },
  spring: {
    extend: colors(secondaryColorDark, secondaryColor, secondaryColorDarker),
    color: white,
    '&:active': {
      '& $actionButtonIcon': {
        display: 'flex'
      },
      '& $actionButtonIconActive': {
        display: 'none'
      }
    },
    '& $actionButtonIcon': {
      display: 'none'
    },
    '& $actionButtonIconActive': {
      display: 'flex'
    }
  },
  tomato: {
    extend: colors(errorColorDark, errorColor, errorColorDarker),
    color: white,
    '&:active': {
      '& $actionButtonIcon': {
        display: 'flex'
      },
      '& $actionButtonIconActive': {
        display: 'none'
      }
    },
    '& $actionButtonIcon': {
      display: 'none'
    },
    '& $actionButtonIconActive': {
      display: 'flex'
    }
  },
  actionButtonIcon: {
    display: 'flex',
    paddingRight: 7,
    '@global': {
      svg: {
        width: 14,
        height: 14
      }
    }
  },
  actionButtonIconActive: {}
}
