import typographyStyles from 'src/components/typography/styles'
import {
  fontColor,
  offColor,
  inputFontSize,
  inputFontWeight
} from 'src/styling/variables'

const { info3 } = typographyStyles

const styles = {
  masked: {
    position: 'absolute',
    bottom: 5,
    left: 4,
    color: fontColor,
    fontSize: inputFontSize,
    fontWeight: inputFontWeight
  },
  secretSpan: {
    extend: info3,
    color: offColor
  },
  hideSpan: {
    display: 'none'
  },
  maskedInput: {
    '& input': {
      pointerEvents: 'none',
      backgroundColor: 'transparent',
      zIndex: -1
    }
  }
}

export { styles }
