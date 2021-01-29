import {
  spacer,
  fontPrimary,
  fontSecondary,
  primaryColor,
  subheaderColor,
  errorColor
} from 'src/styling/variables'

const styles = {
  footer: {
    display: 'flex',
    flexDirection: 'row',
    margin: [['auto', 0, spacer * 3, 0]]
  },
  modalTitle: {
    marginTop: -5,
    color: primaryColor,
    fontFamily: fontPrimary
  },
  modalLabel1: {
    marginTop: 20
  },
  modalLabel2: {
    marginTop: 40
  },
  inputLabel: {
    color: primaryColor,
    fontFamily: fontPrimary,
    fontSize: 24,
    marginLeft: 8,
    marginTop: 15
  },
  tableWidth: {
    width: 1132
  },
  radioGroup: {
    flexDirection: 'row',
    width: 500
  },
  radioLabel: {
    width: 150,
    height: 48
  },
  copyToClipboard: {
    marginLeft: 'auto',
    paddingTop: 7,
    marginRight: -5
  },
  chip: {
    backgroundColor: subheaderColor,
    fontFamily: fontPrimary,
    marginLeft: 15,
    marginTop: -5
  },
  actionChip: {
    backgroundColor: subheaderColor,
    marginRight: 15,
    marginTop: -5
  },
  info: {
    fontFamily: fontSecondary,
    textAlign: 'justify'
  },
  addressWrapper: {
    backgroundColor: subheaderColor,
    marginTop: 8,
    height: 35
  },
  address: {
    margin: `0px ${spacer * 2}px 0px ${spacer * 2}px`,
    paddingRight: -15
  },
  errorMessage: {
    fontFamily: fontSecondary,
    color: errorColor
  },
  codeContainer: {
    marginTop: 15,
    marginBottom: 15
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  submit: {
    margin: [['auto', 0, 0, 'auto']]
  },
  error: {
    color: errorColor
  },
  link: {
    position: 'absolute',
    top: 10,
    left: 0,
    bottom: '-20px',
    right: '-20px',
    whiteSpace: 'nowrap',
    overflowX: 'auto',
    width: '92.5%'
  },
  linkWrapper: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative'
  }
}

export default styles
