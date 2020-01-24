import { offColor } from 'src/styling/variables'
import theme from 'src/styling/theme'

const localStyles = {
  section: {
    marginBottom: 41
  },
  sectionTitle: {
    color: offColor
  }
}

const inputSectionStyles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    '& > *': {
      marginLeft: 20
    },
    '& > :first-child': {
      marginLeft: 0
    },
    '& > button': {
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      height: '100%'
    },
    '& > div': {
      padding: [[0, theme.spacing(1)]],
      lineHeight: 'normal'
    }
  }
}

export { localStyles, inputSectionStyles }
