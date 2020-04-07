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
