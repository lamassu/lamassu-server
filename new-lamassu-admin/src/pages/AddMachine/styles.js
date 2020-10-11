import { backgroundColor, mainWidth } from 'src/styling/variables'

const fill = '100%'
const flexDirection = 'column'

const styles = {
  dialog: {
    backgroundColor,
    width: fill,
    minHeight: fill,
    display: 'flex',
    flexDirection,
    padding: 0
  },
  wrapper: {
    width: mainWidth,
    height: fill,
    margin: '0 auto',
    flex: 1,
    display: 'flex',
    flexDirection
  },
  contentDiv: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row'
  },
  headerDiv: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  contentWrapper: {
    marginLeft: 48
  },
  button: {
    marginTop: 64
  },
  nameTitle: {
    marginTop: 16,
    marginBottom: 25
  },
  qrTitle: {
    marginTop: 12,
    marginBottom: 40
  },
  qrCodeWrapper: {
    display: 'flex'
  },
  qrTextWrapper: {
    width: 381,
    marginLeft: 80,
    display: 'flex'
  },
  qrTextIcon: {
    marginRight: 16
  },
  qrText: {
    marginTop: 0
  }
}

export default styles
