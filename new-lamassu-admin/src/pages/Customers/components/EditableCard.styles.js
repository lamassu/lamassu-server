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
    marginTop: 20,
    display: 'flex',
    justifyContent: 'right'
  },
  deleteButton: {
    marginRight: 8
  },
  headerWrapper: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 40
  },
  editingWrapper: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  replace: {
    marginRight: 5
  },
  input: {
    display: 'none'
  },
  button: {
    marginRight: 5
  },
  editingButtons: {
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
