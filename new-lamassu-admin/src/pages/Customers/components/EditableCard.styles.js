import { tomato, spring4, comet } from 'src/styling/variables'

export default {
  label1: {
    display: 'flex',
    width: 85,
    justifyContent: 'right'
  },
  label1Pending: {
    color: comet
  },
  label1Rejected: {
    color: tomato
  },
  label1Accepted: {
    color: spring4
  },
  editButton: {
    marginTop: 30,
    display: 'flex',
    justifyContent: 'right'
  },
  button: {
    marginRight: 8
  },
  editingButtons: {
    marginTop: 30,
    display: 'flex',
    justifyContent: 'right'
  },
  card: {
    borderRadius: 10,
    marginRight: 15,
    marginBottom: 15
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 15
  },
  editIcon: {
    marginTop: 5
  },
  cardIcon: {
    marginTop: 7
  },
  cardTitle: {
    margin: [[8, 15, 15, 15]]
  }
}
