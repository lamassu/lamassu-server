import {
  spacer,
  white,
  zircon,
  secondaryColor,
  spring3,
  comet
} from 'src/styling/variables'

const styles = {
  background: {
    position: 'absolute',
    width: '100vw',
    height: '100vh',
    left: 0,
    top: 0,
    zIndex: -1,
    backgroundColor: white,
    height: '100vh'
  },
  container: {
    left: -200,
    top: -42,
    backgroundColor: white,
    height: '110vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  headerText: {
    marginTop: spacer * 2.5,
    marginLeft: spacer * 3
  },
  actionButtons: {
    display: 'flex',
    marginLeft: spacer * 2
  },
  notificationIcon: {
    position: 'absolute',
    left: spacer * 33,
    top: spacer * 2 + 4,
    cursor: 'pointer',
    background: 'transparent',
    boxShadow: '0px 0px 0px transparent',
    border: '0px solid transparent',
    textShadow: '0px 0px 0px transparent',
    outline: 'none'
  },
  clearAllButton: {
    marginTop: -spacer * 2,
    marginLeft: spacer,
    backgroundColor: zircon
  },
  notificationsList: {
    zIndex: 10,
    width: 440,
    height: '90vh',
    maxHeight: '100vh',
    marginTop: 8,
    marginLeft: 0,
    marginRight: 10,
    overflowY: 'auto',
    overflowX: 'hidden',
    backgroundColor: white,
    zIndex: 10
  },
  notificationRow: {
    position: 'relative',
    marginBottom: spacer / 2,
    paddingTop: spacer * 1.5
  },
  unread: {
    backgroundColor: spring3
  },
  notificationRowIcon: {
    alignSelf: 'center',
    '& > *': {
      marginLeft: spacer * 3
    }
  },
  unreadIcon: {
    marginLeft: spacer,
    width: '12px',
    height: '12px',
    backgroundColor: secondaryColor,
    borderRadius: '50%',
    cursor: 'pointer',
    zIndex: 1
  },
  notificationTitle: {
    margin: 0,
    color: comet
  },
  notificationBody: {
    margin: 0
  },
  notificationSubtitle: {
    margin: 0,
    marginBottom: spacer,
    color: comet
  },
  stripes: {
    position: 'absolute',
    height: '100%',
    top: '0px',
    opacity: '60%'
  },
  hasUnread: {
    position: 'absolute',
    top: 0,
    left: 16,
    width: '9px',
    height: '9px',
    backgroundColor: secondaryColor,
    borderRadius: '50%'
  }
}

export default styles
