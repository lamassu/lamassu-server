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
    borderRadius: 5
  },
  link: {
    alignItems: 'center',
    display: 'flex',
    extend: p,
    position: 'relative',
    color: offDarkColor,
    padding: 15,
    cursor: 'pointer'
  },
  activeLink: {
    display: 'flex',
    alignItems: 'center',
    extend: tl2,
    color: white,
    backgroundColor: offDarkColor,
    '&:first-child': {
      borderRadius: [[5, 5, 0, 0]]
    },
    '&:last-child': {
      borderRadius: [[0, 0, 5, 5]]
    }
  },
  icon: {
    marginRight: 15
  }
}
