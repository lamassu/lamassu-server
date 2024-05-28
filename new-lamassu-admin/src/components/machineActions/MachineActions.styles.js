import typographyStyles from 'src/components/typography/styles'
import { offColor, spacer, errorColor } from 'src/styling/variables'

const { label1 } = typographyStyles

const machineActionsStyles = {
  label: {
    extend: label1,
    color: offColor,
    marginBottom: 4
  },
  inlineChip: {
    marginInlineEnd: '0.25em'
  },
  stack: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'start'
  },
  mr: {
    marginRight: spacer,
    marginBottom: spacer
  },
  warning: {
    color: errorColor
  }
}

const diagnosticsModal = {
  modal: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1em'
  },
  photo: {
    width: 350
  },
  photoWrapper: {
    marginTop: spacer * 3,
    display: 'flex'
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    margin: [['auto', 0, spacer * 3, 0]]
  },
  downloadLogs: {
    margin: [['auto', spacer, 0, 'auto']]
  },
  message: {
    margin: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  }
}

export { machineActionsStyles, diagnosticsModal }
