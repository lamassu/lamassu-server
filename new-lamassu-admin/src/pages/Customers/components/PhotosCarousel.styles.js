import typographyStyles from 'src/components/typography/styles'
import { offColor } from 'src/styling/variables'

const { p } = typographyStyles

export default {
  label: {
    color: offColor,
    margin: [[0, 0, 6, 0]]
  },
  firstRow: {
    padding: [[8]],
    display: 'flex',
    flexDirection: 'column'
  },
  secondRow: {
    extend: p,
    display: 'flex',
    padding: [[8]],
    '& > div': {
      display: 'flex',
      flexDirection: 'column',
      '& > div': {
        height: 37,
        marginBottom: 15,
        marginRight: 55
      }
    }
  }
}
