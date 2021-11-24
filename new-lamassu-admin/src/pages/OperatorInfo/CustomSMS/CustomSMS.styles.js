import { spacer } from 'src/styling/variables'

const styles = {
  header: {
    display: 'flex',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 800
  },
  form: {
    '& > *': {
      marginTop: 20
    },
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    margin: [['auto', 0, spacer * 3, 0]]
  },
  submit: {
    margin: [['auto', 0, 0, 'auto']]
  }
}

export default styles
