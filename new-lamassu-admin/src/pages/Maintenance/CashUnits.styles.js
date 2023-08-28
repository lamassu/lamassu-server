import { offColor, offDarkColor } from 'src/styling/variables'

export default {
  cashbox: {
    height: 36
  },
  tBody: {
    maxHeight: '65vh',
    overflow: 'auto'
  },
  tableWidth: {
    display: 'flex',
    alignItems: 'center',
    marginRight: 1
  },
  descriptions: {
    color: offColor,
    marginTop: 0
  },
  cashboxReset: {
    color: offColor,
    margin: [[13, 0, -5, 20]]
  },
  selection: {
    marginRight: 12
  },
  downloadLogsButton: {
    marginLeft: 13
  },
  unitsRow: {
    display: 'flex',
    flexDirection: 'row',
    margin: [[10, 0]],
    '& > *': {
      marginRight: 30
    },
    '& > *:last-child': {
      marginRight: 0
    }
  },
  units: {
    display: 'flex',
    flexDirection: 'row',
    '& > *': {
      marginRight: 10
    },
    '& > *:last-child': {
      marginRight: 0
    }
  },
  verticalLine: {
    height: '100%',
    width: 1,
    backgroundColor: offDarkColor
  },
  dataTable: {
    marginBottom: 80
  }
}
