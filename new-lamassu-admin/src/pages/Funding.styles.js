import { disabledColor2, spacer, subheaderColor, placeholderColor } from '../styling/variables'

import typographyStyles from '../components/typography/styles'

const { label1 } = typographyStyles

export default {
  wrapper: {
    display: 'flex',
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
  firstItem: {
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
  }
}
