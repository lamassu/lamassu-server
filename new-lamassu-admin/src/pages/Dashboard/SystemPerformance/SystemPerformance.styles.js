import {
  offColor,
  spacer,
  primaryColor,
  fontSize3,
  fontSecondary,
  fontColor,
  spring4,
  tomato
} from 'src/styling/variables'

const styles = {
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
    cursor: 'pointer',
    minHeight: 0,
    minWidth: 0,
    padding: 0,
    color: offColor,
    textTransform: 'none',
    borderBottom: `2px solid transparent`,
    display: 'inline-block',
    lineHeight: 1.5,
    '&:hover': {
      backgroundColor: 'transparent'
    }
  },
  newHighlightedLabel: {
    cursor: 'pointer',
    borderRadius: 0,
    minHeight: 0,
    minWidth: 0,
    textTransform: 'none',
    borderBottom: `2px solid ${primaryColor}`,
    display: 'inline-block',
    lineHeight: 1.5,
    '&:hover': {
      backgroundColor: 'transparent'
    }
  },
  navButton: {
    marginLeft: 24
  },
  navContainer: {
    display: 'flex'
  },
  profitLabel: {
    fontSize: fontSize3,
    fontFamily: fontSecondary,
    fontWeight: 700,
    color: fontColor
  },
  percentUp: {
    fontSize: fontSize3,
    fontFamily: fontSecondary,
    fontWeight: 700,
    color: spring4,
    height: 10
  },
  percentDown: {
    fontSize: fontSize3,
    fontFamily: fontSecondary,
    fontWeight: 700,
    color: tomato,
    height: 13
  },
  profitContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '0 26px -30px 16px',
    position: 'relative'
  },
  gridContainer: {
    marginTop: 30
  }
}

export default styles
