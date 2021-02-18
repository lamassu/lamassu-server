import { comet } from 'src/styling/variables'

export default {
  footerLabel: {
    color: comet,
    alignSelf: 'center'
  },
  footerContent: {
    width: 1200,
    height: 64,
    display: 'flex',
    justifyContent: 'space-around'
  },
  footerContainer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: 'white',
    display: 'flex',
    justifyContent: 'space-around',
    boxShadow: [[0, -1, 10, 0, 'rgba(50, 50, 50, 0.1)']]
  }
}
