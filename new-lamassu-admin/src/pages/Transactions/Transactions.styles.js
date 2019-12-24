import typographyStyles from 'src/components/typography/styles'
import { offColor, white } from 'src/styling/variables'
import baseStyles from 'src/pages/Logs.styles'

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
  wrapper: {
    display: 'flex',
    flexDirection: 'column'
  },
  col: {
    display: 'flex',
    flexDirection: 'column'
  },
  col1: {
    width: 413
  },
  col2: {
    width: 506
  },
  col3: {
    width: 233
  },
  innerRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: [[25, 0]]
  },
  mono: {
    extend: mono
  },
  txIcon: {
    marginRight: 10
  },
  availableIds: {
    width: 110,
    marginRight: 61,
    '& > div': {
      display: 'flex',
      flexDirection: 'row',
      '& button': {
        '&:first-child': {
          marginRight: 4
        },
        '&:last-child': {
          marginLeft: 4
        },
        '&:only-child': {
          margin: 0
        },
        '&:nth-child(2):last-child': {
          margin: 0
        }
      }
    }
  },
  commissionWrapper: {
    width: 110,
    marginRight: 155
  },
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
  },
  cryptoAddr: {
    width: 252
  },
  txId: {
    width: 346
  },
  sessionId: {
    width: 184
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
