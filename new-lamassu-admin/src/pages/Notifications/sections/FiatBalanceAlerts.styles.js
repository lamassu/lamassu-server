import { backgroundColor, offDarkColor } from 'src/styling/variables'

export default {
  wrapper: {
    display: 'flex'
  },
  form: {
    marginBottom: 36
  },
  title: {
    marginTop: 0
  },
  row: {
    width: 236,
    display: 'grid',
    gridTemplateColumns: 'repeat(2,1fr)',
    gridTemplateRows: '1fr',
    gridColumnGap: 18,
    gridRowGap: 0
  },
  col2: {
    width: 136
  },
  cashboxLabel: {
    marginRight: 4,
    fontSize: 20
  },
  cashboxEmptyPart: {
    backgroundColor: `${backgroundColor}`
  },
  formWrapper: {
    display: 'flex',
    flexDirection: 'column'
  },
  formRow: {
    display: 'flex',
    flexDirection: 'row'
  },
  verticalLine: {
    height: '165px',
    width: 1,
    backgroundColor: offDarkColor
  }
}
