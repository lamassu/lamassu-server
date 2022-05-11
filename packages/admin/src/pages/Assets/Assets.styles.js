import {
  white,
  offColor,
  backgroundColor,
  subheaderColor
} from 'src/styling/variables'

const styles = () => ({
  card: {
    wordWrap: 'break-word',
    boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.08)',
    borderRadius: 12,
    padding: 24,
    backgroundColor: white
  },
  h4: {
    marginTop: 0
  },
  label: {
    margin: 0,
    color: offColor
  },
  asset: {
    float: 'left'
  },
  amount: {
    float: 'right'
  },
  row: {
    backgroundColor: backgroundColor,
    borderBottom: 'none'
  },
  totalRow: {
    backgroundColor: subheaderColor,
    borderBottom: 'none'
  },
  leftSide: {
    margin: [[0, 10, 20, 0]]
  },
  rightSide: {
    margin: [[0, 0, 0, 10]]
  }
})

export default styles
