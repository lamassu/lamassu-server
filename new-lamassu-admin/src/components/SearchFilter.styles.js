import {
  primaryColor,
  zircon,
  smallestFontSize,
  inputFontFamily,
  inputFontWeight,
  spacer,
  offColor
} from 'src/styling/variables'

const chipStyles = {
  root: {
    marginLeft: 0,
    height: 20,
    backgroundColor: zircon,
    '&:hover, &:focus, &:active': {
      backgroundColor: zircon
    },
    marginBottom: 'auto'
  },
  label: {
    fontSize: smallestFontSize,
    fontWeight: inputFontWeight,
    fontFamily: inputFontFamily,
    paddingRight: 0,
    paddingLeft: spacer,
    color: primaryColor
  }
}

const styles = {
  button: {
    width: 8,
    height: 8,
    marginLeft: 8,
    marginRight: 8
  },
  text: {
    marginTop: 0,
    marginBottom: 0
  },
  filters: {
    display: 'flex',
    marginBottom: 16
  },
  deleteWrapper: {
    display: 'flex',
    marginLeft: 'auto',
    justifyContent: 'flex-end',
    flexDirection: 'row'
  },
  entries: {
    color: offColor,
    margin: 'auto',
    marginRight: 12
  },
  chips: {
    marginTop: 'auto'
  }
}

export { chipStyles, styles }
