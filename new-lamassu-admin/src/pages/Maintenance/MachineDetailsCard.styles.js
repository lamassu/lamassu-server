import { fade } from '@material-ui/core/styles/colorManipulator'

import {
  detailsRowStyles,
  labelStyles
} from 'src/pages/Transactions/Transactions.styles'
import { spacer, comet, primaryColor, fontSize4 } from 'src/styling/variables'

const machineDetailsStyles = {
  ...detailsRowStyles,
  colDivider: {
    width: 1,
    margin: [[spacer * 2, spacer * 4]],
    backgroundColor: comet,
    border: 'none'
  },
  inlineChip: {
    marginInlineEnd: '0.25em'
  },
  stack: {
    display: 'flex',
    flexDirection: 'row'
  },
  wrapper: {
    display: 'flex',
    marginTop: 24,
    marginBottom: 32,
    fontSize: fontSize4
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 36
  },
  list: {
    padding: 0,
    margin: 0,
    listStyle: 'none'
  },
  item: {
    height: spacer * 3,
    marginBottom: spacer * 1.5
  },
  link: {
    color: primaryColor,
    textDecoration: 'none'
  },
  divider: {
    margin: '0 1rem'
  },
  mr: {
    marginRight: spacer
  },
  separator: {
    width: 1,
    height: 170,
    zIndex: 1,
    marginRight: 60,
    marginLeft: 'auto',
    background: fade(comet, 0.5)
  }
}

export { labelStyles, machineDetailsStyles }
