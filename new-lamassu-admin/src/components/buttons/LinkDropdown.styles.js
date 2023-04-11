import { subheaderColor } from 'src/styling/variables'

export default {
  wrapper: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  optionList: {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    zIndex: 999,
    marginTop: 25,
    width: 225
  },
  option: {
    padding: '15px 20px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: subheaderColor
    },
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
}
