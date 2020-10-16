export default {
  row: {
    display: 'flex',
    flexDirection: 'row'
  },
  unzoomedImg: ({ width, height }) => ({
    objectFit: 'cover',
    borderRadius: '8px 0px 0px 8px',
    width,
    height
  }),
  button: ({ height }) => ({
    borderRadius: '0px 8px 8px 0px',
    height
  }),
  popoverContent: {
    display: 'block',
    padding: [[10, 15]]
  }
}
