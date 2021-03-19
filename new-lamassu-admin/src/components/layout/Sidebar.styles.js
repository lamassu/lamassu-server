import typographyStyles from 'src/components/typography/styles'
import { respondTo } from 'src/styling/helpers'
import {
  primaryColor,
  spacer,
  placeholderColor,
  zircon,
  xxl
} from 'src/styling/variables'

const { tl2, p } = typographyStyles

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
    padding: spacer * 3,
    flexDirection: 'column',
    [respondTo(xxl)]: {
      width: 'auto',
      marginLeft: 0,
      minWidth: 250,
      boxShadow: `-200px 0px 0px 0px ${sidebarColor}`
    }
  },

  link: {
    extend: p,
    position: 'relative',
    color: placeholderColor,
    margin: '12px 24px 12px 0',
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
    extend: tl2,
    color: primaryColor,
    '&::after': {
      height: '140%'
    }
  },
  customRenderLink: {
    '&:hover::after': {
      height: '100%'
    },
    '&:after': {
      bottom: 0
    }
  },
  customRenderActiveLink: {
    '&::after': {
      height: '100%'
    }
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
  }
}
