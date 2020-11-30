import {
  backgroundColor,
  offColor,
  errorColor,
  primaryColor
} from 'src/styling/variables'

const styles = {
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
  // temporary, when notifications are enabled delete this one and decomment above
  table: {
    maxHeight: 465,
    minHeight: 465,
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
  }
}

export default styles
