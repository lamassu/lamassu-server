import { offColor } from 'src/styling/variables'

const styles = {
  header: {
    display: 'flex',
    '& > button': {
      border: 'none',
      backgroundColor: 'transparent',
      marginLeft: 20,
      cursor: 'pointer'
    }
  },
  section: {
    marginBottom: 52
  }
}

const contactInfoStyles = {
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 28,
    '&:last-child': {
      marginBottom: 0
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
  },
  radioButtonsRow: {
    height: 60
  },
  radioButtons: {
    display: 'flex',
    flexDirection: 'row'
  },
  submit: {
    justifyContent: 'flex-start',
    padding: [[0, 4, 4, 4]],
    height: 20,
    '& > button': {
      marginRight: 40
    }
  }
}

export { styles, contactInfoStyles }
