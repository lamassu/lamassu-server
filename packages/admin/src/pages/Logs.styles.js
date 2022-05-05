import { fontSize5 } from 'src/styling/variables'

export default {
  titleWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row'
  },
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    height: '100%'
  },
  tableWrapper: {
    flex: 1,
    marginLeft: 40,
    display: 'block',
    overflowX: 'auto',
    width: '100%',
    maxWidth: '78%',
    maxHeight: '70vh'
  },
  table: {
    whiteSpace: 'nowrap',
    display: 'block',
    '& th': {
      position: 'sticky',
      top: 0
    }
  },
  dateColumn: {
    minWidth: 160
  },
  levelColumn: {
    minWidth: 100
  },
  fillColumn: {
    width: '100%'
  },
  shareButton: {
    margin: 8,
    display: 'flex',
    alignItems: 'center',
    fontSize: fontSize5,
    padding: [[0, 12]]
  },
  shareIcon: {
    marginRight: 6
  },
  button: {
    margin: 8
  },
  titleAndButtonsContainer: {
    display: 'flex'
  },
  buttonsWrapper: {
    display: 'flex',
    marginLeft: 16,
    '& > *': {
      margin: 'auto 6px'
    }
  }
}
