import { spacer, errorColor } from 'src/styling/variables'

const styles = {
  identification: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '& > *:first-child': {
      marginRight: 10
    }
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    '& > *': {
      marginBottom: 20
    }
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'row',
    '& > *': {
      marginLeft: 15
    },
    '& > *:first-child': {
      marginLeft: 0
    }
  },
  discountRateWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  discountInput: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    margin: [['auto', 0, spacer * 3, 0]]
  },
  submit: {
    margin: [['auto', 0, 0, 'auto']]
  },
  error: {
    color: errorColor
  }
}

export default styles
