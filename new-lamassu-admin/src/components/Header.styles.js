import {
  version,
  mainWidth,
  spacer,
  white,
  primaryColor,
  placeholderColor,
  subheaderColor,
  fontColor
} from 'src/styling/variables'

import typographyStyles from './typography/styles'

const { tl2, p } = typographyStyles

let headerHeight = spacer * 7
let subheaderHeight = spacer * 5

if (version === 8) {
  headerHeight = spacer * 8
  subheaderHeight = spacer * 7
}

export default {
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
    flex: 1
  },
  ul: {
    display: 'flex',
    marginBottom: spacer * 1,
    paddingInlineStart: spacer * 4.5
  },
  li: {
    extend: tl2,
    height: spacer * 3,
    listStyle: 'none',
    color: white,
    padding: `0 ${spacer * 2.5}px`
  },
  link: {
    extend: p,
    textDecoration: 'none',
    border: 'none',
    color: white,
    backgroundColor: 'transparent',
    '&:hover': {
      extend: tl2,
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
      transition: 'all 0.2s cubic-bezier(0.95, 0.1, 0.45, 0.94)'
    }
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
    extend: tl2,
    color: white,
    '&::after': {
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
    paddingInlineStart: spacer * 4.5
  },
  subheaderLi: {
    extend: tl2,
    display: 'flex',
    alignItems: 'center',
    height: spacer * 3,
    listStyle: 'none',
    padding: `0 ${spacer * 2.5}px`
  },
  subheaderLink: {
    extend: tl2,
    textDecoration: 'none',
    border: 'none',
    color: placeholderColor
  },
  activeSubheaderLink: {
    color: fontColor
  },
  white: {
    color: white
  }
}
