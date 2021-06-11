import baseButtonStyles from 'src/components/buttons/BaseButton.styles'
import { offColor, white } from 'src/styling/variables'

const { baseButton } = baseButtonStyles

export default {
  button: {
    extend: baseButton,
    padding: 0,
    color: white,
    borderRadius: baseButton.height / 2
  },
  normalButton: {
    width: baseButton.height
  },
  activeButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: offColor,
    fontWeight: 'bold',
    padding: '0 5px',
    '&:hover': {
      backgroundColor: offColor
    }
  },
  buttonIcon: {
    width: 16,
    height: 16,
    overflow: 'visible',
    '& g': {
      strokeWidth: 1.8
    }
  },
  buttonIconActiveLeft: {
    marginRight: 12,
    marginLeft: 4
  },
  buttonIconActiveRight: {
    marginRight: 5,
    marginLeft: 20
  },
  white: {
    color: white
  }
}
