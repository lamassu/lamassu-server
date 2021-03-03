import { offColor } from 'src/styling/variables'

const styles = ({ numberOfChips }) => ({
  totalAssetWrapper: {
    display: 'flex',
    flexDirection: 'row'
  },
  totalAssetFieldWrapper: {
    display: 'flex',
    flexDirection: 'column'
  },
  fieldHeader: {
    color: offColor,
    marginBottom: 5
  },
  fieldValue: {
    fontSize: 36
  },
  fieldCurrency: {
    fontSize: 20,
    alignSelf: 'flex-end',
    margin: [[0, 0, 5, 5]]
  },
  separator: {
    fontSize: 32,
    alignSelf: 'center',
    margin: [[25, 20, 0, 20]]
  },
  walletChipList: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  walletChipWrapper: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: `16.66667%`,
    '&:nth-child(6n+1)': {
      '& > div': {
        margin: [[0, 10, 0, 0]]
      }
    },
    '&:nth-child(6n)': {
      '& > div': {
        margin: [[0, 0, 0, 10]]
      }
    },
    margin: [[10, 0]]
  },
  walletChip: {
    height: 200,
    margin: [[0, 10]]
  },
  walletHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  btcLogo: {
    transform: `scale(0.4, 0.4)`,
    margin: [[-8, 0, 0, -26]]
  },
  ethLogo: {
    transform: `scale(0.35, 0.35)`,
    margin: [[-16, 0, -7, -15]],
    maxHeight: 80,
    maxWidth: 80
  },
  ltcLogo: {
    transform: `scale(0.4, 0.4)`,
    margin: [[-8, 0, 0, -26]]
  },
  zecLogo: {
    transform: `scale(0.4, 0.4)`,
    margin: [[-15, 0, -9, -14]],
    maxHeight: 80,
    maxWidth: 80
  },
  bchLogo: {
    transform: `scale(0.4, 0.4)`,
    margin: [[-8, 0, 0, -15]]
  },
  dashLogo: {
    transform: `scale(0.4, 0.4)`,
    margin: [[-13, 0, -10, -10]],
    maxHeight: 80,
    maxWidth: 80
  },
  hedgedText: {
    color: offColor,
    margin: [[13, 12, 0, 0]]
  },
  walletValueWrapper: {
    display: 'flex',
    flexDirection: 'column',
    margin: [[0, 0, 0, 15]]
  },
  walletValue: {
    fontSize: 18,
    margin: [[0, 0, 10, 0]]
  },
  walletChipTitle: {
    marginTop: 50
  }
})

export default styles
