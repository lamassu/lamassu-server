import { primaryColor, comet } from 'src/styling/variables'

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  h4: {
    margin: 0,
    marginBottom: 10
  },
  centerLabel: {
    marginBottom: 0,
    padding: 0,
    textAlign: 'center'
  },
  upperButtonLabel: {
    marginTop: -3,
    marginBottom: 24
  },
  button: {
    color: primaryColor,
    marginTop: 0,
    minHeight: 0,
    minWidth: 0,
    padding: 0,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'transparent'
    }
  },
  alertsTableContainer: {
    margin: 0
  },
  expandedAlertsTableContainer: {
    margin: 0,
    maxHeight: 460
  },
  noAlertsLabel: {
    color: comet,
    marginLeft: -5
  },
  table: {
    maxHeight: 465,
    overflowX: 'hidden',
    overflowY: 'auto'
  },
  listItemText: {
    margin: '8px 0 8px 0'
  },
  linkIcon: {
    marginLeft: 'auto',
    cursor: 'pointer'
  }
}
export default styles
