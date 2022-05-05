import typographyStyles from 'src/components/typography/styles'
import baseStyles from 'src/pages/Logs.styles'
import { offColor, white } from 'src/styling/variables'

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
  }
}

export { cpcStyles, detailsRowStyles, labelStyles, mainStyles }
