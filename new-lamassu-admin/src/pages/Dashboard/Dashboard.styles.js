import typographyStyles from 'src/components/typography/styles'
import { spacer, white, primaryColor } from 'src/styling/variables'
const { label1 } = typographyStyles

export default {
  root: {
    flexGrow: 1,
    marginBottom: 108
  },
  footer: {
    margin: [['auto', 0, spacer * 3, 'auto']]
  },
  card: {
    wordWrap: 'break-word',
    boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.08)',
    borderRadius: 12,
    padding: 24,
    backgroundColor: white
  },
  h4: {
    margin: 0,
    marginRight: spacer * 8
  },
  label: {
    color: primaryColor,
    minHeight: 0,
    minWidth: 0,
    padding: 0,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'transparent'
    }
  },
  actionButton: {
    marginTop: -4
  },
  headerLabels: {
    display: 'flex',
    flexDirection: 'row',
    '& div': {
      display: 'flex',
      alignItems: 'center'
    },
    '& > div:first-child': {
      marginRight: 24
    },
    '& span': {
      extend: label1,
      marginLeft: 6
    }
  },
  button: {
    color: primaryColor,
    minHeight: 0,
    minWidth: 0,
    padding: 0,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'transparent'
    }
  }
}
