import { createMuiTheme } from '@material-ui/core/styles'

import { backgroundColor, inputFontFamily, secondaryColor } from './variables'

export default createMuiTheme({
  typography: {
    fontFamily: inputFontFamily
  },
  MuiButtonBase: {
    disableRipple: true
  },
  palette: {
    primary: {
      light: secondaryColor,
      dark: secondaryColor,
      main: secondaryColor
    },
    secondary: {
      light: secondaryColor,
      dark: secondaryColor,
      main: secondaryColor
    },
    background: {
      default: backgroundColor
    }
  }
})
