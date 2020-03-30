import { bySize, bold } from 'src/styling/helpers'

export default {
  cancelButton: {
    marginRight: 20
  },
  withSuffix: ({ textAlign }) => ({
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: textAlign === 'right' && 'end'
  }),
  suffix: {
    marginLeft: 7
  },
  size: ({ size }) => bySize(size),
  bold
}
