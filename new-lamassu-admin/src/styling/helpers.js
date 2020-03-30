import {
  inputFontSize,
  inputFontSizeLg,
  inputFontSizeSm,
  inputFontWeightBold
} from './variables'

const respondTo = breakpoint =>
  `@media only screen and (max-width: ${breakpoint})`

const bySize = size => {
  switch (size) {
    case 'sm':
      return { fontSize: inputFontSizeSm }
    case 'lg':
      return { fontSize: inputFontSizeLg, fontWeight: inputFontWeightBold }
    default:
      return { fontSize: inputFontSize }
  }
}

const bold = {
  fontWeight: inputFontWeightBold
}

export { respondTo, bySize, bold }
