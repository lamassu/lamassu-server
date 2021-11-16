import { comet } from 'src/styling/variables'

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
  customerBlock: props => ({
    display: 'flex',
    flexDirection: 'row',
    margin: [[0, 0, 4, 0]],
    padding: [[0, props.blocked ? 35 : 48, 0]]
  }),
  customerDiscount: {
    display: 'flex',
    flexDirection: 'row',
    margin: [[0, 0, 4, 0]],
    padding: [[0, 23.5, 0]]
  },
  customerManualDataEntry: {
    display: 'flex',
    flexDirection: 'row',
    margin: [[8, 0, 4, 0]],
    padding: [[0, 40.5, 0]]
  },
  panels: {
    display: 'flex'
  },
  rightSidePanel: {
    display: 'block',
    width: 1100
  },
  leftSidePanel: {
    width: 300
  }
}
