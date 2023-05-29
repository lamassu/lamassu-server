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
    const justifyContent = textAlign === 'right' ? 'flex-end' : textAlign
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent
    }
  },
  suffix: {
    margin: [[0, 0, 0, 7]]
  },
  withPrefix: ({ textAlign }) => {
    const justifyContent = textAlign === 'right' ? 'flex-end' : textAlign
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent
    }
  },
  prefix: {
    margin: [[0, 7, 0, 0]]
  },
  size: ({ size }) => bySize(size),
  bold,
  fields: {
    display: 'flex',
    flexDirection: 'column'
  }
}
