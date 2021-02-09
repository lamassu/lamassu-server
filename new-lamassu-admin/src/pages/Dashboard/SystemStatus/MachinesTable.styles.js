import {
  backgroundColor,
  offColor,
  errorColor,
  primaryColor
} from 'src/styling/variables'

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  label: {
    margin: 0,
    color: offColor
  },
  row: {
    backgroundColor: backgroundColor,
    borderBottom: 'none'
  },
  clickableRow: {
    cursor: 'pointer'
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
  buttonLabel: {
    position: 'absolute',
    bottom: 160,
    marginBottom: 0
  },
  upperButtonLabel: {
    textAlign: 'center',
    marginBottom: 0,
    marginTop: 0
  },
  statusHeader: {
    marginLeft: 2
  },
  table: {
    maxHeight: 440,
    '&::-webkit-scrollbar': {
      width: 7
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: offColor,
      borderRadius: 5
    }
  },
  tableBody: {
    overflow: 'auto'
  },
  h4: {
    marginTop: 0
  },
  tl2: {
    display: 'inline'
  },
  label1: {
    display: 'inline'
  },
  machinesTableContainer: {
    marginTop: 10,
    height: 230
  },
  expandedMachinesTableContainer: {
    marginTop: 10,
    height: 442
  }
}

export default styles
