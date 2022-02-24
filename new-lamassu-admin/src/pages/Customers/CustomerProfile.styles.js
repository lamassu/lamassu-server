import { comet, subheaderColor, spacer } from 'src/styling/variables'

export default {
  labelLink: {
    cursor: 'pointer',
    color: comet
  },
  breadcrumbs: {
    margin: [[20, 0]]
  },
  actionLabel: {
    color: comet,
    margin: [[4, 0]]
  },
  customerDetails: {
    marginBottom: 18
  },
  actionButton: {
    margin: [[0, 0, 4, 0]],
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  actionBar: {
    display: 'flex',
    flexDirection: 'column',
    width: 219
  },
  panels: {
    display: 'flex'
  },
  rightSidePanel: {
    display: 'block',
    width: 1100,
    marginBottom: 25
  },
  leftSidePanel: {
    width: 300,
    '& > *': {
      marginBottom: 25
    },
    '& > *:last-child': {
      marginBottom: 0
    },
    '& > *:first-child': {
      marginBottom: 50
    }
  },
  userStatusAction: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: subheaderColor,
    borderRadius: 8,
    padding: [[0, 5]]
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
  },
  errorMessage: {
    marginLeft: 38
  }
}
