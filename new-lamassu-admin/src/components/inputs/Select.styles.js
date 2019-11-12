import { zircon, comet, white, fontSecondary } from '../../styling/variables'
import typographyStyles from '../typography/styles'

const { select, regularLabel, label, label2 } = typographyStyles

const WIDTH = 152

export default {
  select: {
    width: WIDTH,
    zIndex: 1000,
    '& label': {
      extend: regularLabel,
      color: comet,
      paddingLeft: 10
    },
    '& button': {
      extend: select,
      position: 'relative',
      border: 0,
      backgroundColor: zircon,
      width: WIDTH,
      padding: '6px 0 6px 12px',
      borderRadius: 20,
      lineHeight: '1.14',
      textAlign: 'left',
      color: comet,
      cursor: 'pointer',
      outline: '0 none'
    },
    '& ul': {
      maxHeight: '200px',
      width: WIDTH,
      overflowY: 'auto',
      position: 'absolute',
      margin: 0,
      borderTop: 0,
      padding: 0,
      borderRadius: '0 0 16px 16px',
      backgroundColor: zircon,
      outline: '0 none',
      '& li': {
        listStyleType: 'none',
        padding: '6px 0 6px 12px',
        cursor: 'pointer'
      },
      '& li:hover': {
        backgroundColor: comet,
        color: white
      }
    },
    '& svg': {
      position: 'absolute',
      top: 12,
      right: 14,
      fill: comet
    }
  },
  selectFiltered: {
    '& button': {
      backgroundColor: comet,
      color: white
    },
    '& ul': {
      '& li': {
        backgroundColor: comet,
        color: white
      },
      '& li:hover': {
        backgroundColor: zircon,
        color: comet
      }
    },
    '& svg': {
      fill: `${white} !important`
    }
  },
  open: {
    '& button': {
      borderRadius: '16px 16px 0 0'
    }
  }
}
