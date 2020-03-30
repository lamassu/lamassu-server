import { bySize, bold } from 'src/styling/helpers'
import { secondaryColor } from 'src/styling/variables'

export default {
  size: ({ size }) => bySize(size),
  bold,
  root: ({ width, textAlign }) => ({
    width,
    '& input': {
      textAlign
    }
  }),
  underline: {
    '&:before': {
      borderBottomColor: secondaryColor
    },
    '&:hover:not(.Mui-disabled)::before': {
      borderBottomColor: secondaryColor
    }
  }
}
