import typographyStyles from 'src/components/typography/styles'
import { zircon, offDarkColor, white } from 'src/styling/variables'

const { tl2, p } = typographyStyles

const sidebarColor = zircon

export default {
  sidebar: {
    display: 'flex',
    backgroundColor: sidebarColor,
    width: 219,
    flexDirection: 'column',
    borderRadius: 5,
    marginBottom: 50
  },
  link: {
    extend: p,
    position: 'relative',
    color: offDarkColor,
    padding: 15,
    cursor: 'pointer'
  },
  activeLink: {
    extend: tl2,
    color: white,
    backgroundColor: offDarkColor,
    '&:first-child': {
      borderRadius: '5px 5px 0px 0px'
    },
    '&:last-child': {
      borderRadius: '0px 0px 5px 5px'
    }
  }
}
