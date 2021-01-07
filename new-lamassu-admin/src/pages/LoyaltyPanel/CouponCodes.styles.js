import {
  spacer,
  fontPrimary,
  primaryColor,
  errorColor
} from 'src/styling/variables'

const styles = {
  footer: {
    margin: [['auto', 0, spacer * 3, 'auto']]
  },
  modalLabel1: {
    marginTop: 20
  },
  modalLabel2Wrapper: {
    marginTop: 40,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  discountInput: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  inputLabel: {
    color: primaryColor,
    fontFamily: fontPrimary,
    fontSize: 24,
    marginLeft: 8,
    marginTop: 15
  },
  tableWidth: {
    width: 620
  },
  error: {
    color: errorColor
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  }
}

export default styles
