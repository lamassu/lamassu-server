import typographyStyles from 'src/components/typography/styles'
import {
  backgroundColor,
  offColor,
  errorColor,
  primaryColor,
  white
} from 'src/styling/variables'
const { label1 } = typographyStyles

export default {
  label: {
    color: offColor
  },
  tickerLabel: {
    color: offColor,
    marginTop: -5
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
  root: {
    flexGrow: 1
  },
  footer: {
    position: 'fixed',
    left: 0,
    bottom: 0,
    width: '100vw',
    backgroundColor: white,
    textAlign: 'left',
    height: 88,
    boxShadow: '0px -1px 10px 0px rgba(50, 50, 50, 0.1)'
  },
  content: {
    width: 1200,
    margin: '0 auto',
    backgroundColor: white,
    marginTop: 4
  },
  headerLabels: {
    whiteSpace: 'pre',
    display: 'flex',
    flexDirection: 'row',
    '& div': {
      display: 'flex',
      alignItems: 'center'
    },
    '& > div:first-child': {
      marginRight: 24
    },
    '& span': {
      extend: label1,
      marginLeft: 6
    },
    marginTop: -20
  }
}
