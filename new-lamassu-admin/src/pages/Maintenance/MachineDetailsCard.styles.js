import { fade } from '@material-ui/core/styles/colorManipulator'

import {
  detailsRowStyles,
  labelStyles
} from 'src/pages/Transactions/Transactions.styles'
import { spacer, comet, primaryColor, fontSize4 } from 'src/styling/variables'

const machineDetailsStyles = {
  ...detailsRowStyles,
  wrapper: {
    display: 'flex',
    // marginTop: 24,
    // marginBottom: 32,
    marginTop: 12,
    marginBottom: 16,
    fontSize: fontSize4
  },
  row: {
    display: 'flex',
    flexDirection: 'row'
    // marginBottom: 36
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
