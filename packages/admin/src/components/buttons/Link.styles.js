import { fade } from '@material-ui/core/styles/colorManipulator'

import typographyStyles from 'src/components/typography/styles'
import {
  white,
  linkPrimaryColor,
  linkSecondaryColor,
  zircon
} from 'src/styling/variables'

const { h4 } = typographyStyles

const color = color => ({
  boxShadow: `inset 0 -4px 0 0 ${fade(color, 0.8)}`,
  '&:hover': {
    boxShadow: 'none',
    backgroundColor: fade(color, 0.8)
  }
})

export default {
  link: {
    extend: h4,
    textDecoration: 'none',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: '0',
    height: '100%'
  },
  primary: {
    extend: color(linkPrimaryColor)
  },
  secondary: {
    extend: color(linkSecondaryColor),
    '&:hover': {
      color: white
    }
  },
  noColor: {
    extend: color(white)
  },
  action: {
    extend: color(linkPrimaryColor),
    color: zircon
  }
}
