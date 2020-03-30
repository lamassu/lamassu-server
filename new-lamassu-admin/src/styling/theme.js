import { createMuiTheme } from '@material-ui/core/styles'

import {
  backgroundColor,
  inputFontFamily,
  secondaryColor,
  fontColor,
  offColor,
  subheaderColor,
  fontSize5
} from './variables'

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
  },
  overrides: {
    MuiAutocomplete: {
      root: {
        color: fontColor
      },
      noOptions: {
        padding: [[6, 16]]
      },
      option: {
        '&[data-focus="true"]': {
          backgroundColor: subheaderColor
        }
      },
      paper: {
        color: fontColor,
        margin: 0
      },
      listbox: {
        padding: 0
      },
      tag: {
        '&[data-tag-index="0"]': {
          marginLeft: 0
        },
        backgroundColor: subheaderColor,
        borderRadius: 4,
        height: 18
      }
    },
    MuiChip: {
      label: {
        paddingLeft: 4,
        paddingRight: 4,
        color: fontColor,
        fontSize: fontSize5
      }
    },
    MuiInput: {
      root: {
        color: fontColor
      },
      underline: {
        '&:before': {
          borderBottom: [[2, 'solid', fontColor]]
        }
      }
    },
    MuiInputLabel: {
      root: {
        font: 'inherit',
        color: offColor
      },
      shrink: {
        color: fontColor
      }
    },
    MuiFormLabel: {
      root: {
        '&$focused': {
          color: fontColor
        }
      }
    }
  }
})
