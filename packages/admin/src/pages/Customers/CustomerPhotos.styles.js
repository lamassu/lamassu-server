const styles = {
  header: {
    display: 'flex',
    flexDirection: 'row'
  },
  title: {
    marginTop: 7,
    marginRight: 24,
    marginBottom: 32
  },
  photosChipList: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14
  },
  image: {
    objectFit: 'cover',
    objectPosition: 'center',
    width: 224,
    height: 200,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4
  },
  photoCardChip: {
    cursor: 'pointer'
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    margin: [[8, 0, 0, 8]]
  },
  date: {
    margin: [[0, 0, 8, 12]]
  }
}

export default styles
