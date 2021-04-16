import { errorColor, spacer } from 'src/styling/variables'

const styles = {
  flex: {
    display: 'flex'
  },
  column: {
    flexDirection: 'column'
  },
  choiceList: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 240,
    overflowY: 'auto'
  },
  button: {
    width: 120,
    height: 28,
    marginTop: 28
  },
  textInput: {
    width: 420
  },
  row: {
    flexDirection: 'row'
  },
  subtitle: {
    marginBottom: 0
  },
  radioSubtitle: {
    marginBottom: 0
  },
  error: {
    color: errorColor
  },
  tl1: {
    marginLeft: 8,
    marginTop: 25
  },
  numberField: {
    marginTop: 109,
    maxWidth: 115
  },
  label: {
    width: 200,
    marginRight: spacer
  }
}

export default styles
