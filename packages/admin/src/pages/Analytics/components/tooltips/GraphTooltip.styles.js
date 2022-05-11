import { comet } from 'src/styling/variables'

const styles = {
  dotOtWrapper: {
    position: 'absolute',
    top: coords => coords?.y ?? 0,
    left: coords => coords?.x ?? 0,
    width: 150,
    padding: 12,
    borderRadius: 8
  },
  dotOtTransactionAmount: {
    margin: [[8, 0, 8, 0]]
  },
  dotOtTransactionVolume: {
    color: comet
  },
  dotOtTransactionClasses: {
    marginTop: 15,
    '& p > span': {
      marginLeft: 5
    },
    '& p:last-child': {
      marginTop: 5
    }
  }
}

export default styles
