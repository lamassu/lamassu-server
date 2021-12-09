import { spacer } from 'src/styling/variables'

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    '& > *': {
      marginTop: 20
    },
    '& > *:last-child': {
      marginTop: 'auto'
    }
  },
  submit: {
    margin: [['auto', 0, 0, 'auto']]
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    margin: [['auto', 0, spacer * 3, 0]]
  }
}

export default styles
