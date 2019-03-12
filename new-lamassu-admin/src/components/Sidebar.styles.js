import { respondTo } from '../styling/helpers'
import { primaryColor, spacer, placeholderColor, zircon, xxl } from '../styling/variables'

const sidebarColor = zircon

export default {
  sidebar: {
    display: 'flex',
    backgroundColor: sidebarColor,
    width: 520,
    marginLeft: -300,
    boxShadow: `-500px 0px 0px 0px ${sidebarColor}`,
    borderRadius: '0 20px 0 0',
    alignItems: 'flex-end',
    padding: spacer * 2.5,
    flexDirection: 'column',
    [respondTo(xxl)]: {
      width: 'auto',
      marginLeft: 0,
      minWidth: 250,
      boxShadow: `-200px 0px 0px 0px ${sidebarColor}`
    }
  },

  link: {
    position: 'relative',
    color: placeholderColor,
    marginRight: 24,
    cursor: 'pointer',
    '&:hover::after': {
      height: '140%'
    },
    '&:after': {
      content: '""',
      display: 'block',
      background: primaryColor,
      width: 4,
      height: 0,
      left: '100%',
      marginLeft: 20,
      bottom: -2,
      position: 'absolute',
      borderRadius: 1000,
      transition: 'all 0.2s cubic-bezier(0.95, 0.1, 0.45, 0.94)'
    }
  },
  activeLink: {
    color: primaryColor,
    fontWeight: 700,
    '&::after': {
      height: '140%'
    }
  }
}
