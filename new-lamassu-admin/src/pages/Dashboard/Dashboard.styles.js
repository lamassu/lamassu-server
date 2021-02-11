import typographyStyles from 'src/components/typography/styles'
import { spacer, white, primaryColor, comet } from 'src/styling/variables'
const { label1 } = typographyStyles

const styles = {
  headerLabels: {
    display: 'flex',
    flexDirection: 'row'
  },
  headerLabelContainerMargin: {
    marginRight: 24
  },
  headerLabelContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  headerLabelSpan: {
    extend: label1,
    marginLeft: 6
  },
  root: {
    flexGrow: 1,
    display: 'flex'
  },
  footer: {
    margin: [['auto', 0, spacer * 3, 'auto']]
  },
  card: {
    wordWrap: 'break-word',
    boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.08)',
    borderRadius: 12,
    padding: 24,
    backgroundColor: white,
    flex: 1,
    marginRight: 24
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  button: {
    color: primaryColor,
    minHeight: 0,
    minWidth: 0,
    padding: 0,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'transparent'
    }
  },
  upperButtonLabel: {
    textAlign: 'center',
    marginBottom: 0,
    marginTop: 0,
    marginLeft: spacer
  },
  alertsCard: {
    marginBottom: spacer
  },
  h4: {
    marginTop: 0
  },
  centerLabel: {
    marginTop: 40,
    marginBottom: 0
  },
  notAlertsLabel: {
    marginTop: 40,
    color: comet
  },
  systemStatusCard: {
    flex: 1,
    marginTop: spacer
  },
  expandedCard: {
    flex: 0.9
  },
  shrunkCard: {
    flex: 0.1
  },
  displayFlex: {
    display: 'flex',
    flex: 0.85,
    flexDirection: 'column'
  }
}

export default styles
