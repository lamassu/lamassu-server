import typographyStyles from 'src/components/typography/styles'
import {
  placeholderColor,
  backgroundColor,
  primaryColor,
  mainWidth,
  spring2,
  spring3,
  errorColor
} from 'src/styling/variables'

const { tl2, p } = typographyStyles

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
  qrTextInfoWrapper: {
    display: 'flex',
    flexDirection: 'row'
  },
  qrTextWrapper: {
    width: 381,
    marginLeft: 80,
    display: 'flex',
    flexDirection: 'column'
  },
  textWrapper: {
    display: 'flex',
    flexDirection: 'column'
  },
  qrTextIcon: {
    marginRight: 16
  },
  qrText: {
    marginTop: 0
  },
  item: {
    position: 'relative',
    margin: '12px 0 12px 0',
    display: 'flex'
  },
  itemText: {
    extend: p,
    color: placeholderColor,
    marginRight: 24
  },
  itemTextActive: {
    extend: tl2,
    color: primaryColor
  },
  itemTextPast: {
    color: primaryColor
  },
  stepperPath: {
    position: 'absolute',
    height: 25,
    width: 1,
    border: [[1, 'solid', placeholderColor]],
    right: 8,
    top: 18
  },
  stepperPast: {
    border: [[1, 'solid', primaryColor]]
  },
  successMessageWrapper: {
    backgroundColor: spring3,
    display: 'flex',
    flexDirection: 'row',
    padding: '0px 10px',
    borderRadius: '8px'
  },
  successMessage: {
    color: spring2,
    margin: '8px 0px'
  },
  successMessageIcon: {
    marginRight: 16,
    marginBottom: 2,
    display: 'flex',
    flexDirection: 'col',
    alignItems: 'center'
  },
  errorMessage: {
    color: errorColor
  }
}

export default styles
