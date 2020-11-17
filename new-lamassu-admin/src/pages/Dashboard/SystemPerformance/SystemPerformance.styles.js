import {
  offColor,
  spacer,
  primaryColor,
  fontSize3,
  fontSecondary,
  fontColor,
  secondaryColorDarker,
  linkSecondaryColor
} from 'src/styling/variables'

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
    color: secondaryColorDarker
  },
  percentDown: {
    fontSize: fontSize3,
    fontFamily: fontSecondary,
    fontWeight: 700,
    color: linkSecondaryColor
  }
}
