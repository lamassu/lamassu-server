import {
  spacer,
  fontPrimary,
  primaryColor,
  white,
  errorColor
} from 'src/styling/variables'
const styles = {
  grid: {
    flex: 1,
    height: '100%'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    marginLeft: spacer * 6
  },
  footer: {
    margin: [['auto', 0, spacer * 3, 'auto']]
  },
  modalTitle: {
    lineHeight: '120%',
    color: primaryColor,
    fontSize: 14,
    fontFamily: fontPrimary,
    fontWeight: 900
  },
  subtitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row'
  },
  white: {
    color: white
  },
  deleteButton: {
    paddingLeft: 13
  },
  addressRow: {
    marginLeft: 8
  },
  error: {
    color: errorColor
  }
}

export default styles
