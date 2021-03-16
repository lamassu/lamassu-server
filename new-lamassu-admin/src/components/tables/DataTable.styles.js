import { zircon } from 'src/styling/variables'

export default {
  expandButton: {
    outline: 'none',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: 4
  },
  rowWrapper: {
    // workaround to shadows cut by r-virtualized when scroll is visible
    padding: 1
  },
  row: {
    border: [[2, 'solid', 'transparent']],
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
    marginBottom: 30,
    minHeight: 200,
    width,
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  }),
  emptyTable: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 52
  }
}
