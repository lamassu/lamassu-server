import typographyStyles from 'src/components/typography/styles'
import baseStyles from 'src/pages/Logs.styles'
import {
  offColor,
  white,
  primaryColor,
  zircon,
  smallestFontSize,
  inputFontFamily,
  inputFontWeight,
  spacer
} from 'src/styling/variables'

const { label1, mono, p } = typographyStyles
const { titleWrapper, titleAndButtonsContainer, buttonsWrapper } = baseStyles

const cpcStyles = {
  wrapper: {
    extend: mono,
    display: 'flex',
    alignItems: 'center',
    height: 32
  },
  address: {
    lineBreak: 'anywhere'
  },
  buttonWrapper: {
    '& button': {
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer'
    }
  },
  popoverContent: {
    extend: label1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: white,
    borderRadius: 4,
    padding: [[5, 9]]
  }
}

const detailsRowStyles = {
  idCardDataCard: {
    extend: p,
    display: 'flex',
    padding: [[11, 8]],
    '& > div': {
      display: 'flex',
      flexDirection: 'column',
      '& > div': {
        width: 144,
        height: 37,
        marginBottom: 15,
        '&:last-child': {
          marginBottom: 0
        }
      }
    }
  }
}

const labelStyles = {
  label: {
    extend: label1,
    color: offColor,
    marginBottom: 4
  }
}

const mainStyles = {
  titleWrapper,
  titleAndButtonsContainer,
  buttonsWrapper,
  text: {
    marginTop: 0,
    marginBottom: 0
  },
  headerLabels: {
    display: 'flex',
    flexDirection: 'row',
    '& div': {
      display: 'flex',
      alignItems: 'center'
    },
    '& > div:first-child': {
      marginRight: 24
    },
    '& span': {
      extend: label1,
      marginLeft: 6
    }
  },
  overflowTd: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis'
  },
  button: {
    width: 8,
    height: 8,
    marginLeft: 8
  }
}

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

export { cpcStyles, detailsRowStyles, labelStyles, mainStyles, chipStyles }
