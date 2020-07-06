import typographyStyles from 'src/components/typography/styles'
import {
  white,
  disabledColor,
  secondaryColor,
  secondaryColorDark,
  secondaryColorDarker,
  spacer
} from 'src/styling/variables'

const { h1, h3 } = typographyStyles

const pickSize = size => {
  switch (size) {
    case 'xl':
      return spacer * 7.625
    case 'sm':
      return spacer * 4
    case 'lg':
    default:
      return spacer * 5
  }
}

export default {
  wrapper: ({ size }) => {
    const height = pickSize(size)
    const shadowSize = height / 12
    return { height: height + shadowSize / 2 }
  },
  button: ({ size }) => {
    const height = pickSize(size)
    const shadowSize = size === 'xl' ? 3 : height / 12
    const padding = size === 'xl' ? 20 : height / 2

    return {
      extend: size === 'xl' ? h1 : h3,
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
      padding: `0 ${padding}px`,
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
