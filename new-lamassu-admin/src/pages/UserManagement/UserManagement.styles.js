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
    margin: [['auto', 0, spacer * 3, 'auto']]
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
    paddingTop: 6,
    paddingLeft: 15,
    marginRight: -11
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
    marginTop: 8
  },
  address: {
    margin: `${spacer * 1.5}px ${spacer * 3}px`
  },
  errorMessage: {
    fontFamily: fontSecondary,
    color: errorColor
  },
  codeContainer: {
    marginTop: 15,
    marginBottom: 15
  }
}

export default styles
