import { backgroundColor, errorColor } from 'src/styling/variables'

const styles = {
  title: {
    paddingTop: 8
  },
  input: {
    marginBottom: 25,
    marginTop: -15
  },
  wrapper: {
    padding: '2.5em 4em',
    width: 575,
    display: 'flex',
    flexDirection: 'column'
  },
  titleWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30
  },
  rememberMeWrapper: {
    marginTop: 35,
    display: 'flex',
    flexDirection: 'row'
  },
  icon: {
    transform: 'scale(1.5)',
    marginRight: 25
  },
  checkbox: {
    transform: 'scale(1.5)',
    marginRight: 5,
    marginLeft: -5
  },
  footer: {
    marginTop: '10vh'
  },
  twofaFooter: {
    marginTop: '6vh'
  },
  loginButton: {
    display: 'block',
    width: '100%'
  },
  welcomeBackground: {
    background: 'url(/wizard-background.svg) no-repeat center center fixed',
    backgroundColor: backgroundColor,
    backgroundSize: 'cover',
    height: '100vh',
    width: '100vw',
    position: 'relative',
    left: '50%',
    right: '50%',
    marginLeft: '-50vw',
    marginRight: '-50vw',
    minHeight: '100vh'
  },
  info: {
    marginBottom: '5vh'
  },
  info2: {
    textAlign: 'justify'
  },
  infoWrapper: {
    marginBottom: '3vh'
  },
  errorMessage: {
    color: errorColor
  },
  qrCodeWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '3vh'
  },
  secretWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  secretLabel: {
    marginRight: 15
  },
  secret: {
    marginRight: 35
  },
  hiddenSecret: {
    marginRight: 35,
    filter: 'blur(8px)'
  },
  confirm2FAInput: {
    marginTop: 25
  },
  confirmPassword: {
    marginTop: 25
  },
  error: {
    color: errorColor
  }
}

export default styles
