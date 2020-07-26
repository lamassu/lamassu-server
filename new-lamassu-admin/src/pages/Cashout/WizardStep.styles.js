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
  suffix: {
    paddingLeft: spacer * 2
  },
  button: {
    marginLeft: 'auto'
  },
  submit: {
    float: 'right'
  },
  picker: {
    width: LABEL_WIDTH
  },
  header: {
    display: 'flex',
    paddingBottom: 96,
    '& div': {
      flex: 1
    },
    '& img': {
      position: 'relative',
      top: -20,
      right: 14
    }
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1,
    paddingBottom: 32
  },
  disclaimer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    '& > p': {
      '& > svg': {
        float: 'left',
        margin: [[-4, 16, 48, 0]]
      }
    }
  }
}
