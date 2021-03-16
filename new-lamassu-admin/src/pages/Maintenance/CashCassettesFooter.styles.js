import { comet } from 'src/styling/variables'

export default {
  footerLabel: {
    color: comet,
    alignSelf: 'center'
  },
  footerContent: {
    width: 1200,
    maxHeight: 64,
    display: 'flex',
    justifyContent: 'space-around',
    position: 'fixed'
  },
  footerContainer: {
    position: 'fixed',
    height: 64,
    left: 0,
    bottom: 0,
    width: '100vw',
    backgroundColor: 'white',
    display: 'flex',
    justifyContent: 'space-around',
    boxShadow: [[0, -1, 10, 0, 'rgba(50, 50, 50, 0.1)']]
  },
  flex: {
    display: 'flex',
    // temp marginLeft until cashIn square is enabled
    marginLeft: -640
  },
  icon: {
    alignSelf: 'center',
    height: 20,
    width: 20,
    marginRight: 8
  },
  iconLabel: {
    alignSelf: 'center',
    marginRight: 8
  },
  valueDisplay: {
    alignSelf: 'center'
  }
}
