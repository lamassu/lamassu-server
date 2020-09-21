import { subheaderColor, offColor, white } from '../../../styling/variables'
import typographyStyles from '../../typography/styles'

const { p, label1 } = typographyStyles

const WIDTH = 152

export default {
  selectedItem: {
    width: WIDTH - 41,
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  },
  select: {
    width: WIDTH,
    zIndex: 2,
    '& label': {
      extend: label1,
      color: offColor,
      paddingLeft: 10
    },
    '& button': {
      extend: p,
      position: 'relative',
      border: 0,
      backgroundColor: subheaderColor,
      width: WIDTH,
      padding: [[6, 0, 6, 12]],
      borderRadius: 20,
      lineHeight: '1.14',
      textAlign: 'left',
      color: offColor,
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
      borderRadius: [[0, 0, 8, 8]],
      backgroundColor: subheaderColor,
      outline: '0 none',
      '& li': {
        extend: p,
        listStyleType: 'none',
        padding: [[6, 12]],
        cursor: 'pointer',
        '& span': {
          width: '100%',
          display: 'block',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }
      },
      '& li:hover': {
        backgroundColor: offColor,
        color: white
      }
    },
    '& svg': {
      position: 'absolute',
      top: 12,
      right: 14,
      fill: offColor
    }
  },
  selectFiltered: {
    '& button': {
      backgroundColor: offColor,
      color: white
    },
    '& ul': {
      '& li': {
        backgroundColor: offColor,
        color: white
      },
      '& li:hover': {
        backgroundColor: subheaderColor,
        color: offColor
      }
    },
    '& svg': {
      fill: [[white], '!important']
    }
  },
  open: {
    '& button': {
      borderRadius: [[8, 8, 0, 0]]
    }
  }
}
