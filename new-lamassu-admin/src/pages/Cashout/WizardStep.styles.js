import { errorColor, spacer } from 'src/styling/variables'

const LABEL_WIDTH = 150

export default {
  title: {
    margin: [[0, 0, 12, 0]]
  },
  titleDiv: {
    paddingBottom: 32
  },
  subtitle: {
    margin: [[32, 0, 21, 0]]
  },
  edit: {
    margin: [[0, 0, 0, 0]]
  },
  error: {
    color: errorColor
  },
  bill: {
    width: 131,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'end'
  },
  billInput: {
    width: '100%'
  },
  suffix: {
    paddingLeft: spacer * 2
  },
  submit: {
    alignSelf: 'flex-end'
  },
  picker: {
    width: LABEL_WIDTH
  },
  header: {
    display: 'flex'
  },
  column: {
    display: 'flex',
    flexGrow: 2,
    flexDirection: 'column',
    paddingBottom: 32,
    justifyContent: 'space-between'
  },
  step: {
    flex: 1
  },
  stepImage: {
    position: 'relative',
    top: -20,
    right: 14
  },
  disclaimerIcon: {
    float: 'left',
    margin: [[2, 16, 48, 0]]
  }
}
