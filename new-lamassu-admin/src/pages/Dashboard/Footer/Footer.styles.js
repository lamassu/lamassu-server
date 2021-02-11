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
    height:
      expanded && bigFooter
        ? spacer * 12 * 3 + spacer * 3
        : expanded
        ? spacer * 12 * 2 + spacer * 2
        : spacer * 12,
    left: 0,
    bottom: 0,
    position: 'fixed',
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
    backgroundColor: white,
    zIndex: 1,
    position: 'fixed',
    bottom: -spacer,
    transform: 'translateY(-100%)'
  },
  footerContainer: ({ expanded, bigFooter }) => ({
    marginLeft: spacer * 5,
    height: 100,
    marginTop: expanded && bigFooter ? -300 : expanded ? -200 : -100,
    overflow: !expanded && 'hidden'
  }),
  mouseWatcher: ({ expanded, bigFooter }) => ({
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100vw',
    height:
      expanded && bigFooter
        ? spacer * 12 * 3 + spacer * 3
        : expanded
        ? spacer * 12 * 2 + spacer * 2
        : spacer * 12,
    zIndex: 2
  })
}

export default styles
