import { offColor } from 'src/styling/variables'

export default {
  separator: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    margin: '25px 0px',
    '&::before': {
      content: "''",
      flex: 1,
      borderBottom: `1px solid ${offColor}`
    },
    '&::after': {
      content: "''",
      flex: 9,
      borderBottom: `1px solid ${offColor}`
    },
    '&:not(:empty)::before': {
      marginRight: '1em'
    },
    '&:not(:empty)::after': {
      marginLeft: '1em'
    }
  }
}
