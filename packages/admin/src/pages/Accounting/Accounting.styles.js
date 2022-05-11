import { offColor } from 'src/styling/variables'

const styles = () => ({
  totalAssetWrapper: {
    display: 'flex',
    flexDirection: 'row'
  },
  totalAssetFieldWrapper: {
    display: 'flex',
    flexDirection: 'column'
  },
  fieldHeader: {
    color: offColor,
    marginBottom: 5
  },
  fieldValue: {
    fontSize: 36
  },
  fieldCurrency: {
    fontSize: 20,
    alignSelf: 'flex-end',
    margin: [[0, 0, 5, 5]]
  },
  separator: {
    fontSize: 32,
    alignSelf: 'center',
    margin: [[25, 20, 0, 20]]
  },
  tableTitle: {
    marginTop: 35
  },
  operation: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  }
})

export default styles
