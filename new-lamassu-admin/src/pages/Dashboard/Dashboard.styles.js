import typographyStyles from 'src/components/typography/styles'
import { spacer, white, primaryColor } from 'src/styling/variables'
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
    marginBottom: 108
  },
  footer: {
    margin: [['auto', 0, spacer * 3, 'auto']]
  },
  card: {
    wordWrap: 'break-word',
    boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.08)',
    borderRadius: 12,
    padding: 24,
    backgroundColor: white
  },
  leftSideMargin: {
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
    marginTop: 16,
    marginLeft: spacer
  },
  alertsCard: {
    marginBottom: 16
  }
}

export default styles
