import {
  backgroundColor,
  offColor,
  errorColor,
  primaryColor,
  spacer
} from 'src/styling/variables'

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  centerLabel: {
    textAlign: 'center',
    marginBottom: 0,
    marginTop: 0
  },
  label: {
    margin: 0,
    color: offColor
  },
  row: {
    backgroundColor: backgroundColor,
    borderBottom: 'none'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'pre'
  },
  error: {
    color: errorColor
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
  statusHeader: {
    marginLeft: 2
  },
  table: {
    marginTop: spacer * 4,
    maxHeight: 465,
    overflow: 'auto'
  },
  tableBody: {
    overflow: 'auto'
  },
  h4: {
    marginTop: 0
  },
  buttonLabel: {
    textAlign: 'center',
    marginBottom: 0,
    marginTop: 0
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
