import { errorColor, spacer, primaryColor } from 'src/styling/variables'

const LABEL_WIDTH = 150

export default {
  radioGroup: {
    flexDirection: 'row',
    width: 600
  },
  radioLabel: {
    width: LABEL_WIDTH,
    height: 48
  },
  mdForm: {
    width: 385
  },
  infoMessage: {
    display: 'flex',
    marginBottom: 20,
    '& > p': {
      width: 330,
      marginTop: 4,
      marginLeft: 16
    }
  },
  actionButton: {
    marginBottom: spacer * 4
  },
  actionButtonLink: {
    textDecoration: 'none',
    color: primaryColor
  },
  error: {
    color: errorColor
  },
  button: {
    marginTop: spacer * 5
  },
  formButton: {
    margin: [[spacer * 3, 0, 0]]
  }
}
