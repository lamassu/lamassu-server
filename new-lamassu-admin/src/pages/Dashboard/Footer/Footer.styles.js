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
  footer: ({ expanded, bigFooter }) => ({
    height: expanded
      ? bigFooter
        ? spacer * 12 * 2 + spacer * 2
        : spacer * 12 * 3 + spacer * 3
      : spacer * 12,
    position: 'fixed',
    left: 0,
    bottom: 0,
    width: '100vw',
    backgroundColor: white,
    textAlign: 'left',
    boxShadow: '0px -1px 10px 0px rgba(50, 50, 50, 0.1)'
  }),
  tickerLabel: {
    color: offColor,
    marginTop: -5
  },
  content: {
    width: 1200,
    margin: '0 auto',
    backgroundColor: white,
    marginTop: 4
  },
  footerContainer: {
    marginLeft: spacer * 5,
    marginBottom: spacer * 2
  },
  footerItemContainer: {
    marginBottom: 18
  }
}

export default styles
