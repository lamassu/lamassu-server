import typographyStyles from 'src/components/typography/styles'
import baseStyles from 'src/pages/Logs.styles'

const { label1 } = typographyStyles
const { titleWrapper, titleAndButtonsContainer, buttonsWrapper } = baseStyles

const mainStyles = {
  titleWrapper,
  titleAndButtonsContainer,
  buttonsWrapper,
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
  }
}

export { mainStyles }
