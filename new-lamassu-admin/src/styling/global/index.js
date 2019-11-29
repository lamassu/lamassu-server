import { mainWidth } from '../variables'

import fonts from './fonts'

const fill = '100%'

export default {
  '@global': {
    ...fonts,
    '#root': {
      width: fill,
      minHeight: fill
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
    }
  }
}
