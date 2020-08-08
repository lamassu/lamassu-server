import { fade } from '@material-ui/core/styles/colorManipulator'

import { fontSize4, offColor, comet } from 'src/styling/variables'

export default {
  wrapper: {
    display: 'flex',
    marginTop: 24,
    marginBottom: 32,
    fontSize: fontSize4
  },
  column1: {
    width: 600
  },
  column2: {
    flex: 1
  },
  lastRow: {
    display: 'flex',
    flexDirection: 'row'
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 36
  },
  actionRow: {
    display: 'flex',
    flexDirection: 'row',
    marginLeft: -4
  },
  action: {
    marginRight: 4,
    marginLeft: 4
  },
  dialog: {
    width: 434
  },
  label: {
    color: offColor,
    margin: [[0, 0, 6, 0]]
  },
  chips: {
    marginLeft: -2
  },
  status: {
    width: 248
  },
  machineModel: {
    width: 198
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
