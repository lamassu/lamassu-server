import { bySize, bold } from 'src/styling/helpers'

export default {
  saveButton: {
    marginRight: 20
  },
  lastOfGroup: {
    marginBottom: 24
  },
  extraPaddingLeft: {
    paddingLeft: 35
  },
  extraPaddingRight: {
    paddingRight: 45
  },
  withSuffix: ({ textAlign }) => {
    const justifyContent = textAlign === 'right' ? 'end' : textAlign
    return {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent
    }
  },
  suffix: {
    marginLeft: 7
  },
  size: ({ size }) => bySize(size),
  bold
}
