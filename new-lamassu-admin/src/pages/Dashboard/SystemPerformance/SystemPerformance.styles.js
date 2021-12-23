import {
  offColor,
  offDarkColor,
  spacer,
  primaryColor,
  fontSize3,
  fontSecondary,
  fontColor,
  spring4,
  tomato,
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
    color: primaryColor,
    fontWeight: 700,
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
    margin: '23px 26px -30px 16px',
    position: 'relative'
  },
  profitLabel: {
    fontSize: fontSize3,
    fontFamily: fontSecondary,
    fontWeight: 700,
    color: fontColor
  },
  directionIcon: {
    width: 16,
    height: 16,
    marginBottom: -2,
    marginRight: 4
  },
  emptyTransactions: {
    paddingTop: 40
  },
  commissionProfitTitle: {
    marginBottom: 16
  },
  graphHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  labelWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '& > div': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 15,
      '&:first-child': {
        marginLeft: 0
      },
      '& > p': {
        marginLeft: 8
      }
    }
  },
  txGraphContainer: {
    height: 300,
    marginTop: 30
  },
  commissionsGraphContainer: {
    height: 250,
    marginTop: 30
  },
  verticalLine: {
    height: 15,
    width: 1,
    backgroundColor: offDarkColor,
    marginLeft: 31,
    marginRight: 16
  }
}

export default styles
