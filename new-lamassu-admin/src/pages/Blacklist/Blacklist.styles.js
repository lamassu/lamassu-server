import { spacer, white } from 'src/styling/variables'
const styles = {
  grid: {
    flex: 1,
    height: '100%'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  advancedForm: {
    '& > *': {
      marginTop: 20
    },
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    margin: [['auto', 0, spacer * 3, 0]]
  },
  submit: {
    margin: [['auto', 0, 0, 'auto']]
  },
  modalTitle: {
    margin: [['auto', 0, 8.5, 'auto']]
  },
  subtitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row'
  },
  white: {
    color: white
  },
  deleteButton: {
    paddingLeft: 13
  },
  addressRow: {
    marginLeft: 8
  },
  error: {
    marginTop: 20
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
  resetToDefault: {
    width: 145
  }
}

export default styles
