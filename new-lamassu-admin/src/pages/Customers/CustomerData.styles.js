import { offColor, spacer } from 'src/styling/variables'

export default {
  header: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 15
  },
  title: {
    marginTop: 7,
    marginRight: 24
  },
  editIcon: {
    marginTop: 5
  },
  cardIcon: {
    marginTop: 7
  },
  viewIcons: {
    marginRight: 12
  },
  wrapper: {
    display: 'block',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  },
  separator: {
    color: offColor,
    margin: [[8, 0, 8, 150]],
    position: 'relative',
    display: 'inline-block',
    '&:before, &:after': {
      content: '""',
      position: 'absolute',
      background: offColor,
      top: '50%',
      width: 1000,
      height: 1
    },
    '&:before': {
      right: '100%',
      marginRight: 15
    },
    '&:after': {
      left: '100%',
      marginLeft: 15
    }
  },
  closeButton: {
    display: 'flex',
    padding: [[spacer * 2, spacer * 2, 0, spacer * 2]],
    paddingRight: spacer * 1.5,
    justifyContent: 'end'
  },
  dialogTitle: {
    margin: [[0, spacer * 2, spacer, spacer * 4 + spacer]]
  },
  dialogContent: {
    width: 615,
    marginLeft: 16
  },
  dialogActions: {
    padding: spacer * 4,
    paddingTop: spacer * 2
  },
  cancelButton: {
    marginRight: 8,
    padding: 0
  }
}
