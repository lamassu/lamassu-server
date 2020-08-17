import {
  white,
  zircon,
  mistyRose,
  tomato,
  spring3,
  spring4,
  comet,
  fontSize5
} from 'src/styling/variables'

const propertyCardStyles = {
  propertyCard: {
    margin: [[32, 12, 0, 0]],
    padding: [[0, 16]],
    borderRadius: 8
  },
  propertyCardPending: {
    backgroundColor: zircon
  },
  propertyCardRejected: {
    backgroundColor: mistyRose
  },
  propertyCardAccepted: {
    backgroundColor: spring3
  },
  label1: {
    fontFamily: 'MuseoSans',
    fontSize: fontSize5,
    fontWeight: 500,
    fontStretch: 'normal',
    fontStyle: 'normal',
    lineHeight: 1.33,
    letterSpacing: 'normal',
    color: comet,
    margin: [[4, 0]]
  },
  label1Pending: {
    color: comet
  },
  label1Rejected: {
    color: tomato
  },
  label1Accepted: {
    color: spring4
  },
  cardActionButton: {
    height: 28,
    marginLeft: 12
  },
  cardProperties: {
    display: 'flex',
    borderRadius: 8,
    width: '100%',
    height: 'calc(100% - 104px)',
    padding: [[20]],
    boxSizing: 'border-box',
    boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.04)',
    border: 'solid 0',
    backgroundColor: white
  },
  rowSpaceBetween: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  buttonsWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 16,
    marginBottom: 16
  }
}

export { propertyCardStyles }
