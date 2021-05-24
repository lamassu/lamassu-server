import { fade } from '@material-ui/core/styles/colorManipulator'

import typographyStyles from 'src/components/typography/styles'
import {
  offColor,
  spacer,
  comet,
  primaryColor,
  fontSize4,
  errorColor
} from 'src/styling/variables'

const { label1 } = typographyStyles

const machineActionsStyles = {
  colDivider: {
    width: 1,
    margin: [[spacer * 2, spacer * 4]],
    backgroundColor: comet,
    border: 'none'
  },
  label: {
    extend: label1,
    color: offColor,
    marginBottom: 4
  },
  inlineChip: {
    marginInlineEnd: '0.25em'
  },
  stack: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'start'
  },
  wrapper: {
    display: 'flex',
    marginTop: 12,
    marginBottom: 16,
    fontSize: fontSize4
  },
  row: {
    display: 'flex',
    flexDirection: 'row'
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
    marginRight: spacer,
    marginBottom: spacer
  },
  separator: {
    width: 1,
    height: 170,
    zIndex: 1,
    marginRight: 60,
    marginLeft: 'auto',
    background: fade(comet, 0.5)
  },
  warning: {
    color: errorColor
  }
}

export { machineActionsStyles }
