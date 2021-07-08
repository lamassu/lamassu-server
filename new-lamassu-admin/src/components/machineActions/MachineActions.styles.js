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

export { machineActionsStyles }
