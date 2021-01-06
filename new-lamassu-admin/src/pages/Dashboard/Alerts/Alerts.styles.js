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
  /*   table: {
    maxHeight: 440,
    '&::-webkit-scrollbar': {
      width: 7
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: offColor,
      borderRadius: 5
    }
  }, */
  table: {
    paddingTop: spacer * 4,
    maxHeight: 465,
    overflow: 'auto',
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
  buttonLabel: {
    textAlign: 'center',
    marginBottom: 0,
    marginTop: 0
  },
  root: {
    '&:nth-of-type(odd)': {
      backgroundColor: backgroundColor
    }
  },
  listItemText: {
    margin: '8px 0 8px 0'
  }
}
export default styles
