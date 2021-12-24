import { primaryColor, zircon, errorColor } from 'src/styling/variables'

const styles = {
  input: {
    width: '3.5rem !important',
    height: '5rem',
    border: '2px solid',
    borderColor: zircon,
    borderRadius: '4px'
  },
  focus: {
    border: '2px solid',
    borderColor: primaryColor,
    borderRadius: '4px',
    '&:focus': {
      outline: 'none'
    }
  },
  error: {
    borderColor: errorColor
  },
  container: {
    justifyContent: 'space-evenly'
  }
}

export default styles
