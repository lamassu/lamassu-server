import typographyStyles from 'src/components/typography/styles'
import {
  version,
  mainWidth,
  spacer,
  white,
  primaryColor,
  secondaryColor,
  placeholderColor,
  subheaderColor,
  fontColor
} from 'src/styling/variables'

const { tl2, p } = typographyStyles

let headerHeight = spacer * 7
let subheaderHeight = spacer * 5

if (version === 8) {
  headerHeight = spacer * 8
  subheaderHeight = spacer * 7
}

const styles = {
  headerContainer: {
    position: 'relative'
  },
  header: {
    backgroundColor: primaryColor,
    color: white,
    height: headerHeight,
    display: 'flex'
  },
  content: {
    maxWidth: mainWidth,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    margin: '0 auto'
  },
  nav: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  ul: {
    display: 'flex',
    paddingLeft: spacer * 4.5,
    height: spacer * 7,
    margin: 0
  },
  li: {
    // extend: tl2,
    // height: spacer * 7,
    listStyle: 'none',
    color: white,
    margin: [[spacer * 2.5, spacer * 2.5, 0, spacer * 2.5]],
    '&:hover': {
      color: white
    },
    '&:hover::after': {
      width: '50%',
      marginLeft: '-25%'
    },
    position: 'relative',
    '&:after': {
      content: '""',
      display: 'block',
      background: white,
      width: 0,
      height: 4,
      left: '50%',
      marginLeft: 0,
      bottom: -8,
      position: 'absolute',
      borderRadius: 1000,
      transition: [['all', '0.2s', 'cubic-bezier(0.95, 0.1, 0.45, 0.94)']]
    }
  },
  link: {
    extend: p,
    textDecoration: 'none',
    border: 'none',
    color: white,
    backgroundColor: 'transparent'
  },
  forceSize: {
    display: 'inline-block',
    textAlign: 'center',
    '&:after': {
      display: 'block',
      content: 'attr(forcesize)',
      fontWeight: 700,
      height: 0,
      overflow: 'hidden',
      visibility: 'hidden'
    }
  },
  activeLink: {
    color: white,
    '& li::after': {
      width: '50%',
      marginLeft: '-25%'
    }
  },
  addMachine: {
    marginLeft: 'auto'
  },
  subheader: {
    backgroundColor: subheaderColor,
    color: white,
    height: subheaderHeight,
    display: 'flex'
  },
  subheaderUl: {
    display: 'flex',
    paddingLeft: 0
  },
  subheaderLi: {
    extend: tl2,
    display: 'flex',
    alignItems: 'center',
    height: spacer * 3,
    listStyle: 'none',
    padding: [[0, spacer * 2.5]],
    '&:first-child': {
      paddingLeft: 0
    }
  },
  subheaderLink: {
    extend: p,
    textDecoration: 'none',
    border: 'none',
    color: placeholderColor
  },
  activeSubheaderLink: {
    extend: tl2,
    color: fontColor
  },
  white: {
    color: white
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    '& > svg': {
      marginRight: 16
    }
  },
  logoLink: {
    cursor: 'pointer'
  },
  actionButtonsContainer: {
    zIndex: 1,
    position: 'relative',
    display: 'flex',
    justifyContent: 'space-between',
    minWidth: 200,
    transform: 'translateZ(0)'
  },
  notificationIcon: {
    marginTop: spacer / 2,
    cursor: 'pointer',
    background: 'transparent',
    boxShadow: '0px 0px 0px transparent',
    border: '0px solid transparent',
    textShadow: '0px 0px 0px transparent',
    outline: 'none'
  },
  hasUnread: {
    position: 'absolute',
    top: 4,
    left: 182,
    width: '9px',
    height: '9px',
    backgroundColor: secondaryColor,
    borderRadius: '50%'
  },
  popper: {
    zIndex: 1
  }
}

export default styles
