import { offColor } from 'src/styling/variables'

export default {
  header: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 15
  },
  title: {
    marginTop: 7,
    marginRight: 24
  },
  editIcon: {
    marginTop: 5
  },
  cardIcon: {
    marginTop: 7
  },
  viewIcons: {
    marginRight: 12
  },
  wrapper: {
    display: 'flex'
  },
  separator: {
    display: 'flex',
    flexBasis: '100%',
    justifyContent: 'center',
    color: offColor,
    margin: [[8, 0, 8, 0]],
    '&::before, &::after': {
      content: '',
      flexGrow: 1,
      background: offColor,
      height: 1,
      fontSize: 1,
      lineHeight: 0,
      margin: [[0, 8, 0, 8]]
    }
  }
}
