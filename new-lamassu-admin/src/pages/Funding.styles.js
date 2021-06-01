import typographyStyles from 'src/components/typography/styles'
import {
  disabledColor2,
  spacer,
  subheaderColor,
  errorColor,
  placeholderColor,
  comet
} from 'src/styling/variables'

const { label1, mono } = typographyStyles

export default {
  wrapper: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    height: '100%'
  },
  main: {
    display: 'flex',
    flex: 1
  },
  firstSide: {
    margin: `0 ${spacer * 8}px 0 ${spacer * 6}px`
  },
  secondSide: {
    marginTop: -29
  },
  error: {
    color: errorColor
  },
  coinTotal: {
    margin: `${spacer * 1.5}px 0`
  },
  leftSpacer: {
    marginLeft: spacer
  },
  topSpacer: {
    marginTop: spacer * 5
  },
  addressWrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    backgroundColor: subheaderColor
  },
  address: {
    width: 375,
    margin: `${spacer * 1.5}px ${spacer * 3}px`
  },
  itemWrapper: {
    textAlign: 'end'
  },
  item: {
    extend: label1,
    margin: 2
  },
  inactiveItem: {
    color: comet
  },
  firstItem: {
    fontWeight: 700,
    margin: 2
  },
  total: {
    marginTop: 'auto',
    textAlign: 'right',
    marginRight: 24
  },
  totalPending: {
    marginTop: 2
  },
  totalTitle: {
    color: placeholderColor,
    marginBottom: 2
  },
  table: {
    marginTop: spacer,
    marginLeft: spacer * 6
  },
  tableLabel: {
    justifyContent: 'end',
    marginTop: -38
  },
  pending: {
    backgroundColor: disabledColor2
  },
  copyToClipboard: {
    marginLeft: 'auto',
    paddingTop: 6,
    paddingLeft: 15,
    marginRight: -11
  },
  mono: {
    extend: mono,
    width: 375,
    margin: `${spacer * 1.5}px ${spacer * 3}px`
  }
}
