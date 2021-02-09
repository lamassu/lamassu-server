import {
  offColor,
  spacer,
  primaryColor,
  fontSize3,
  fontSecondary,
  fontColor,
  spring4,
  tomato,
  java,
  neon,
  comet
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
  percentNeutral: {
    fontSize: fontSize3,
    fontFamily: fontSecondary,
    fontWeight: 700,
    color: comet
  },
  profitContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '0 26px -30px 16px',
    position: 'relative'
  },
  gridContainer: {
    marginTop: 30,
    height: 225
  },
  inSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
    marginTop: 18,
    marginRight: 4,
    backgroundColor: java
  },
  outSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
    marginTop: 18,
    marginRight: 4,
    backgroundColor: neon
  },
  directionLabelContainer: {
    display: 'flex'
  },
  dirLabContMargin: {
    marginRight: 20
  },
  directionIcon: {
    width: 16,
    height: 16,
    marginBottom: -2,
    marginRight: 4
  }
}

export default styles
