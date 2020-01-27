import { offColor, primaryColor } from 'src/styling/variables'
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
  },
  percentageInput: {
    '& > div': {
      '& .MuiInputBase-input': {
        width: 30
      }
    }
  },
  percentageDisplay: {
    position: 'relative',
    width: 76,
    height: 118,
    border: [['solid', 4, primaryColor]],
    marginRight: 12,
    '& > div': {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      backgroundColor: primaryColor,
      transition: [['height', '0.5s']],
      transitionTimingFunction: 'ease-out'
    }
  }
}

const percentageAndNumericInputStyles = {
  body: {
    display: 'flex',
    alignItems: 'center'
  },
  inputColumn: {}
}

export { localStyles, inputSectionStyles, percentageAndNumericInputStyles }
