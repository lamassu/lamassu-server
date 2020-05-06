import { errorColor } from 'src/styling/variables'

const LABEL_WIDTH = 150

export default {
  title: {
    margin: [[0, 0, 12, 0]]
  },
  subtitle: {
    margin: [[32, 0, 21, 0]]
  },
  error: {
    color: errorColor
  },
  button: {
    marginLeft: 'auto'
  },
  submit: {
    display: 'flex',
    flexDirection: 'row',
    margin: [['auto', 0, 24]]
  },
  picker: {
    width: LABEL_WIDTH
  }
}
