import { offColor, white, spacer } from 'src/styling/variables'

const styles = {
  label: {
    color: offColor
  },
  headerLabels: {
    whiteSpace: 'pre',
    display: 'flex',
    flexDirection: 'row',
    marginTop: -20
  },
  headerLabel: {
    display: 'flex',
    alignItems: 'center'
  },
  txOutMargin: {
    marginLeft: spacer * 3
  },
  tickerLabel: {
    color: offColor,
    marginTop: -5
  },
  footer1: {
    left: 0,
    bottom: 0,
    position: 'fixed',
    width: '100vw',
    backgroundColor: white,
    textAlign: 'left',
    zIndex: 1,
    boxShadow: '0px -1px 10px 0px rgba(50, 50, 50, 0.1)',
    minHeight: spacer * 12,
    transition: 'min-height 0.5s ease-out',
    '&:hover': {
      transition: 'min-height 0.5s ease-in',
      minHeight: 200
    }
  },
  content1: {
    width: 1200,
    maxHeight: 100,
    backgroundColor: white,
    zIndex: 2,
    bottom: -spacer,
    margin: '0 auto'
  }
}

export default styles
