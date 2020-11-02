import { spacer, white } from 'src/styling/variables'

export default {
  root: {
    flexGrow: 1
  },
  footer: {
    margin: [['auto', 0, spacer * 3, 'auto']]
  },

  card: {
    wordWrap: 'break-word',
    boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.08)',
    borderRadius: 12,
    padding: 24,
    backgroundColor: white
  }
}
