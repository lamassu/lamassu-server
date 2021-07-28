import { spacer, errorColor } from 'src/styling/variables'

const styles = {
  identification: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '& > *:first-child': {
      marginLeft: 0
    },
    '& > *': {
      marginLeft: 6
    },
    '& > *:nth-child(3)': {
      marginLeft: 15
    }
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    '& > *:first-child': {
      marginTop: 10
    },
    '& > *': {
      marginBottom: 20
    }
  },
  customerAutocomplete: {
    width: 350
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
