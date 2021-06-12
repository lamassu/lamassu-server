import { offColor } from 'src/styling/variables'

const global = {
  content: {
    display: 'flex'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    flex: 'wrap'
  },
  section: {
    marginBottom: 52
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    width: 600,
    '&:last-child': {
      marginBottom: 0
    }
  },
  switchRow: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    flex: 'wrap',
    justifyContent: 'space-between',
    width: 396
  },
  switch: {
    display: 'flex',
    alignItems: 'center'
  },
  submit: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: [[0, 4, 4, 4]],
    '& > button': {
      marginRight: 40
    }
  },
  transparentButton: {
    '& > *': {
      margin: 'auto 12px'
    },
    '& button': {
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer'
    }
  },
  infoMessage: {
    display: 'flex',
    marginBottom: 52,
    '& > p': {
      width: 330,
      color: offColor,
      marginTop: 4,
      marginLeft: 16
    }
  }
}

const fieldStyles = {
  field: {
    position: 'relative',
    width: 280,
    padding: [[0, 4, 4, 0]]
  },
  notEditing: {
    display: 'flex',
    flexDirection: 'column'
  },
  notEditingSingleLine: {
    '& > p:first-child': {
      height: 16,
      lineHeight: '16px',
      transform: 'scale(0.75)',
      transformOrigin: 'left',
      paddingLeft: 0,
      margin: [[1, 0, 6, 0]]
    },
    '& > p:last-child': {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      height: 25,
      margin: 0
    }
  },
  notEditingMultiline: {
    '& > p:first-child': {
      height: 16,
      lineHeight: '16px',
      transform: 'scale(0.75)',
      transformOrigin: 'left',
      paddingLeft: 0,
      margin: [[1, 0, 5, 0]]
    },
    '& > p:last-child': {
      width: 502,
      height: 121,
      overflowY: 'auto',
      lineHeight: '19px',
      wordWrap: 'anywhere',
      margin: 0
    }
  }
}

export { global, fieldStyles }
