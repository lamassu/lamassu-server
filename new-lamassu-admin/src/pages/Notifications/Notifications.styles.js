import { offColor } from 'src/styling/variables'

const localStyles = {
  section: {
    marginBottom: 41
  },
  sectionTitle: {
    color: offColor
  },
  optionHeader: {
    display: 'flex',
    verticalAlign: 'center',
    '& > button': {
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      heigth: '100%',
      padding: 0,
      marginLeft: 20
    }
  }
}

export { localStyles }
