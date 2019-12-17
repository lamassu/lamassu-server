import {
  white,
  fontColor,
  subheaderColor,
  subheaderDarkColor,
  offColor,
  offDarkColor,
} from 'src/styling/variables'

const colors = (color1, color2, color3) => {
  return {
    backgroundColor: color1,
    '&:hover': {
      backgroundColor: color2,
    },
    '&:active': {
      backgroundColor: color3,
    },
  }
}

const buttonHeight = 32

export default {
  baseButton: {
    extend: colors(subheaderColor, subheaderDarkColor, offColor),
    cursor: 'pointer',
    border: 'none',
    outline: 0,
    height: buttonHeight,
    color: fontColor,
    '&:active': {
      color: white,
    },
  },
  primary: {
    extend: colors(subheaderColor, subheaderDarkColor, offColor),
    '&:active': {
      color: white,
      '& $buttonIcon': {
        display: 'none',
      },
      '& $buttonIconActive': {
        display: 'block',
      },
    },
    '& $buttonIconActive': {
      display: 'none',
    },
  },
  secondary: {
    extend: colors(offColor, offDarkColor, white),
    color: white,
    '&:active': {
      color: fontColor,
      '& $buttonIcon': {
        display: 'flex',
      },
      '& $buttonIconActive': {
        display: 'none',
      },
    },
    '& $buttonIcon': {
      display: 'none',
    },
    '& $buttonIconActive': {
      display: 'flex',
    },
  },
}
