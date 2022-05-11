import typographyStyles from 'src/components/typography/styles'
import {
  spacer,
  white,
  primaryColor,
  zircon,
  zircon2,
  offDarkColor
} from 'src/styling/variables'
const { label1 } = typographyStyles

const styles = {
  headerLabels: {
    display: 'flex',
    flexDirection: 'row',
    '& > div:first-child': {
      display: 'flex',
      alignItems: 'center',
      marginLeft: 0
    },
    '& > div': {
      display: 'flex',
      alignItems: 'center',
      marginLeft: 25
    },
    '& > div:last-child': {
      display: 'flex',
      alignItems: 'center',
      marginLeft: 64
    },
    '& > div > span': {
      extend: label1,
      marginLeft: 7
    }
  },
  root: {
    flexGrow: 1,
    display: 'flex',
    marginBottom: 120
  },
  emptyMachinesRoot: {
    height: 300,
    backgroundColor: zircon,
    border: `solid 2px ${zircon2}`
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
    flexDirection: 'column'
  },
  inline: {
    display: 'inline'
  },
  emptyMachinesContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    '& > :first-child': {
      marginTop: 0
    },
    '& > *': {
      marginTop: 25
    }
  },
  offColor: {
    color: offDarkColor
  }
}

export default styles
