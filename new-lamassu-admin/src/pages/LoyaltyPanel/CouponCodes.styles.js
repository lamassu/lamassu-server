import { spacer, fontPrimary, primaryColor } from 'src/styling/variables'

export default {
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
  modalLabel2Wrapper: {
    marginTop: 40,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  discountInput: {
    display: 'flex',
    height: '100%',
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
  }
}
