import { fontColor, offColor } from 'src/styling/variables'
import typographyStyles from 'src/components/typography/styles'

const { info3 } = typographyStyles

const styles = {
  masked: {
    position: 'absolute',
    bottom: 5,
    color: fontColor
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
