import { offColor, spacer, primaryColor } from 'src/styling/variables'

export default {
  titleWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row'
  },
  titleAndButtonsContainer: {
    display: 'flex'
  },
  error: {
    marginLeft: 12
  },
  icon: {
    marginRight: 6
  },
  h4: {
    margin: 0,
    marginRight: spacer * 8
  },
  label: {
    minHeight: 0,
    minWidth: 0,
    padding: 0,
    color: offColor,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'transparent'
    }
  },
  highlightedLabel: {
    minHeight: 0,
    minWidth: 0,
    padding: 0,
    textTransform: 'none',
    color: primaryColor,
    fontWeight: 'bold',
    textDecoration: 'underline',
    '&:hover': {
      backgroundColor: 'transparent',
      textDecoration: 'underline'
    }
  }
}
