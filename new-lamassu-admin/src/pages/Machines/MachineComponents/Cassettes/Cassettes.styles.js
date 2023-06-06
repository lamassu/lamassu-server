import { offDarkColor } from 'src/styling/variables'

const styles = {
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
    minHeight: 290
  }
}

export default styles
