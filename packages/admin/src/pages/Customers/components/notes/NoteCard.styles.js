import { zircon } from 'src/styling/variables'

const styles = {
  noteCardWrapper: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: `25%`,
    minWidth: 0,
    maxWidth: 500,
    '&:nth-child(4n+1)': {
      '& > div': {
        margin: [[0, 10, 0, 0]]
      }
    },
    '&:nth-child(4n)': {
      '& > div': {
        margin: [[0, 0, 0, 10]]
      }
    },
    margin: [[10, 0]]
  },
  noteCardChip: {
    height: 200,
    margin: [[0, 10]],
    padding: [[10, 10]],
    cursor: 'pointer'
  },
  newNoteCard: {
    backgroundColor: zircon,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  noteCardHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  noteCardTitle: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    marginRight: 10
  },
  noteCardContent: {
    display: 'box',
    lineClamp: 7,
    boxOrient: 'vertical',
    margin: [[15, 0]],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordWrap: 'break-word'
  },
  editCardChip: {
    height: 325,
    padding: 15
  },
  editCardHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  editCardActions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '& > *': {
      marginRight: 10
    },
    '& > *:last-child': {
      marginRight: 0
    }
  },
  editNotesContent: {
    '& > div': {
      '&:after': {
        borderBottom: 'none'
      },
      '&:before': {
        borderBottom: 'none'
      },
      '&:hover:not(.Mui-disabled)::before': {
        borderBottom: 'none'
      }
    }
  }
}

export default styles
