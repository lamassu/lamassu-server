import { offColor } from 'src/styling/variables'

const styles = {
  header: {
    display: 'flex',
    '& > p': {
      marginTop: 0
    },
    '& > div': {
      marginLeft: 20,
      '& > button': {
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer'
      }
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
    width: 600,
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
    height: 60,
    marginBottom: 14
  },
  radioButtons: {
    display: 'flex',
    flexDirection: 'row',
    paddingLeft: 4
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
