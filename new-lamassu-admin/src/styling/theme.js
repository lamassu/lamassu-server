import { createMuiTheme } from '@material-ui/core/styles'

import typographyStyles from 'src/components/typography/styles'

import {
  backgroundColor,
  inputFontFamily,
  secondaryColor,
  fontColor,
  offColor,
  subheaderColor,
  fontSize3,
  fontSize5
} from './variables'

const { p } = typographyStyles

export default createMuiTheme({
  typography: {
    fontFamily: inputFontFamily,
    body1: { ...p }
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
    MuiRadio: {
      colorSecondary: {
        color: secondaryColor
      }
    },
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
        margin: 2,
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
        fontSize: fontSize3,
        color: offColor
      },
      shrink: {
        color: fontColor,
        transform: 'translate(0, 1.7px) scale(0.83)'
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
