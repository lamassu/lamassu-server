import typographyStyles from 'src/components/typography/styles'
import { offColor, comet, white, tomato } from 'src/styling/variables'

const { p } = typographyStyles

export default {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 24
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 36
  },
  secondRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 36
  },
  lastRow: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 32
  },
  label: {
    color: offColor,
    margin: [[0, 0, 6, 0]],
    whiteSpace: 'nowrap'
  },
  txIcon: {
    marginRight: 10
  },
  clipboardPopover: {
    height: 164,
    width: 215
  },
  idButton: {
    marginRight: 4
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
  bold: {
    fontWeight: 700
  },
  direction: {
    width: 233
  },
  availableIds: {
    width: 232
  },
  exchangeRate: {
    width: 250
  },
  commission: {
    width: 217
  },
  address: {
    width: 280
  },
  downloadRawLogs: {
    width: 180
  },
  cancelTransaction: {
    width: 160
  },
  status: {
    width: 230,
    '& > button': {
      marginTop: 20
    }
  },
  transactionId: {
    width: 280
  },
  sessionId: {
    width: 215
  },
  container: {
    display: 'flex'
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px 4px 8px',
    backgroundColor: comet,
    color: white,
    height: 24,
    marginBottom: -24,
    marginTop: -3,
    marginLeft: 7,
    borderRadius: 4
  },
  chipLabel: {
    color: white
  },
  otherActionsGroup: {
    display: 'flex',
    flexDirection: 'row'
  },
  addressHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  walletScore: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '& > p': {
      marginLeft: 5
    }
  },
  error: {
    color: tomato
  },
  swept: {
    width: 250
  }
}
