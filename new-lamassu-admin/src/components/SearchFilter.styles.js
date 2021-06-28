import {
  primaryColor,
  zircon,
  smallestFontSize,
  inputFontFamily,
  inputFontWeight,
  spacer
} from 'src/styling/variables'

const chipStyles = {
  root: {
    borderRadius: spacer / 2,
    marginTop: spacer / 2,
    marginRight: spacer / 4,
    marginBottom: spacer / 2,
    marginLeft: spacer / 4,
    height: spacer * 3,
    backgroundColor: zircon,
    '&:hover, &:focus, &:active': {
      backgroundColor: zircon
    }
  },
  label: {
    fontSize: smallestFontSize,
    fontWeight: inputFontWeight,
    fontFamily: inputFontFamily,
    paddingRight: spacer / 2,
    paddingLeft: spacer / 2,
    color: primaryColor
  }
}

const styles = {
  button: {
    width: 8,
    height: 8,
    marginLeft: 8
  },
  text: {
    marginTop: 0,
    marginBottom: 0
  }
}

export { chipStyles, styles }
