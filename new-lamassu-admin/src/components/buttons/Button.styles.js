import {
  white,
  disabledColor,
  secondaryColor,
  secondaryColorDark,
  secondaryColorDarker,
  spacer
} from '../../styling/variables'

import typographyStyles from '../typography/styles'

const { h3 } = typographyStyles

const pickSize = (size) => {
  switch (size) {
    case 'sm':
      return spacer * 4
    case 'lg':
    default:
      return spacer * 5
  }
}

export default {
  button: ({ size }) => {
    const height = pickSize(size)
    const shadowSize = height / 12

    return {
      extend: h3,
      border: 'none',
      color: white,
      cursor: 'pointer',
      fontWeight: 900,
      outline: 0,
      backgroundColor: secondaryColor,
      '&:disabled': {
        backgroundColor: disabledColor,
        boxShadow: 'none',
        '&:hover': {
          backgroundColor: disabledColor,
          boxShadow: 'none'
        },
        '&:active': {
          marginTop: 0
        }
      },
      shadowSize,
      height,
      padding: `0 ${height / 2}px`,
      borderRadius: height / 4,
      boxShadow: `0 ${shadowSize}px ${secondaryColorDark}`,
      '&:hover': {
        backgroundColor: secondaryColorDark,
        boxShadow: `0 ${shadowSize}px ${secondaryColorDarker}`
      },
      '&:active': {
        marginTop: shadowSize / 2,
        backgroundColor: secondaryColorDark,
        boxShadow: `0 ${shadowSize / 2}px ${secondaryColorDarker}`
      }
    }
  }
}
