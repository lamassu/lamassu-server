import { zircon } from 'src/styling/variables'

export default {
  expandButton: {
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: 4
  },
  row: {
    borderRadius: 0
  },
  expanded: {
    border: [[2, 'solid', zircon]],
    boxShadow: '0 0 8px 0 rgba(0,0,0,0.08)'
  },
  before: {
    paddingTop: 12
  },
  after: {
    paddingBottom: 12
  },
  pointer: {
    cursor: 'pointer'
  },
  body: {
    flex: [[1, 1, 'auto']]
  },
  table: ({ width }) => ({
    width,
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  })
}
