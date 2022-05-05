import { offColor } from 'src/styling/variables'

export default {
  wrapper: ({ width }) => ({
    width: width
  }),
  addLink: {
    marginLeft: 'auto'
  },
  title: {
    margin: 0,
    color: offColor
  },
  outerHeader: {
    minHeight: 16,
    marginBottom: 24,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
}
