export default {
  row: {
    display: 'flex',
    flexDirection: 'row'
  },
  image: ({ width, height }) => ({
    objectFit: 'cover',
    borderRadius: '8px 0px 0px 8px',
    width,
    height
  }),
  popupImage: ({ popupWidth, popupHeight }) => ({
    objectFit: 'cover',
    width: popupWidth,
    height: popupHeight
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
