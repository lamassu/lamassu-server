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
  customerActions: {
    display: 'flex',
    flexDirection: 'row',
    '& button': {
      marginRight: 15
    },
    '& > :last-child': {
      marginRight: 0
    }
  }
}
