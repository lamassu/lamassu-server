import { white, tomato, spring4, comet } from 'src/styling/variables'

const propertyCardStyles = {
  label1: {
    display: 'flex',
    marginBottom: 2,
    marginTop: 'auto',
    width: 85
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
    display: 'flex',
    height: 28,
    marginRight: 'auto',
    marginLeft: 12
  },
  propertyCardTopRow: {
    display: 'flex',
    margin: [[0, 10, 5, 0]]
  },
  propertyCardBottomRow: {
    display: 'flex',
    flexDirection: 'row',
    height: 45
  },
  propertyCard: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 8,
    width: '100%',
    height: 100,
    padding: [[20]],
    boxSizing: 'border-box',
    boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.04)',
    border: 'solid 0',
    backgroundColor: white,
    margin: [[20, 0, 0, 0]]
  },
  rowSpaceBetween: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  columnSpaceBetween: {
    display: 'flex',
    flexFlow: 'column nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 90
  },
  buttonsWrapper: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    marginTop: 'auto'
  }
}

export { propertyCardStyles }
