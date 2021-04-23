import { mainWidth } from 'src/styling/variables'

import fonts from './fonts'

const fill = '100%'

export default {
  '@global': {
    ...fonts,
    '#root': {
      width: fill,
      minHeight: fill
    },
    '.root-notifcenter-open': {
      // for when notification center is open
      overflowY: 'auto',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0
    },
    '.body-notifcenter-open': {
      // for when notification center is open
      overflow: 'hidden'
    },
    '.root-blur': {
      filter: 'blur(1px)',
      pointerEvents: 'none'
    },
    html: {
      height: fill
    },
    body: {
      width: mainWidth,
      display: 'flex',
      minHeight: fill,
      '@media screen and (min-width: 1200px)': {
        width: 'auto'
      }
    },
    [`a::-moz-focus-inner,
    'input[type="submit"]::-moz-focus-inner,
    input[type="button"]::-moz-focus-inner`]: {
      border: 0
    },
    [`a::-moz-focus-inner,
      input[type="submit"]::-moz-focus-inner,
      input[type="button"]::-moz-focus-inner`]: {
      border: 0
    },
    [`a,
    a:visited,
    a:focus,
    a:active,
    a:hover`]: {
      outline: '0 none'
    },
    'button::-moz-focus-inner': {
      border: 0
    },
    // forcing styling onto inner container
    '.ReactVirtualized__Grid__innerScrollContainer': {
      overflow: 'inherit !important'
    }
  }
}
