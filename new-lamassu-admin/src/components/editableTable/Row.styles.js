import { bySize, bold } from 'src/styling/helpers'

export default {
  saveButton: {
    marginRight: 20
  },
  lastOfGroup: {
    marginBottom: 24
  },
  extraPadding: {
    paddingLeft: 35,
    paddingRight: 30
  },
  extraPaddingRight: {
    paddingRight: 39
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
    marginLeft: 7,
    fontSize: '12px'
  },
  size: ({ size }) => bySize(size),
  bold
}
