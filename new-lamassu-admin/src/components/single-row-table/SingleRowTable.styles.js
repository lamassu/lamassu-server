import typographyStyles from 'src/components/typography/styles'
import { offColor, subheaderColor } from 'src/styling/variables'

const { label1, p } = typographyStyles

export default {
  tr: ({ height }) => ({
    margin: 0,
    height
  }),
  trDisabled: ({ height }) => ({
    margin: 0,
    height: height / 2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  }),
  table: ({ width }) => ({
    width
  }),
  headerDisabled: {
    backgroundColor: subheaderColor,
    color: offColor
  },
  head: {
    display: 'flex',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 12
  },
  button: {
    marginBottom: 1
  },
  itemWrapper: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 16,
    minHeight: 35
  },
  label: {
    extend: label1,
    color: offColor,
    marginBottom: 4
  },
  item: {
    extend: p,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  infoMessage: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '& > *': {
      marginRight: 16
    },
    '& > *:last-child': {
      marginRight: 0
    }
  },
  title: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  }
}
