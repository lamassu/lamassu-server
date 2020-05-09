import { spacer, tomato, primaryColor as zodiac } from 'src/styling/variables'

const colors = {
  cashOut: {
    empty: tomato,
    full: zodiac
  },
  cashIn: {
    empty: zodiac,
    full: tomato
  }
}

const colorPicker = ({ percent, cashOut }) =>
  colors[cashOut ? 'cashOut' : 'cashIn'][percent >= 50 ? 'full' : 'empty']

const cashboxStyles = {
  cashbox: {
    borderColor: colorPicker,
    backgroundColor: colorPicker,
    height: 34,
    width: 80,
    border: '2px solid',
    textAlign: 'end',
    display: 'inline-block'
  },
  emptyPart: {
    backgroundColor: 'white',
    height: ({ percent }) => `${100 - percent}%`,
    '& > p': {
      color: colorPicker,
      display: 'inline-block'
    }
  },
  fullPart: {
    backgroundColor: colorPicker,
    height: ({ percent }) => `${percent}%`,
    '& > p': {
      color: 'white',
      display: 'inline'
    }
  }
}

const gridStyles = {
  row: {
    height: 36,
    width: 183,
    display: 'grid',
    gridTemplateColumns: 'repeat(2,1fr)',
    gridTemplateRows: '1fr',
    gridColumnGap: 18,
    gridRowGap: 0
  },
  col2: {
    width: 117
  },
  noMarginText: {
    marginTop: 0,
    marginBottom: 0
  },
  link: {
    marginTop: spacer
  }
}

export { cashboxStyles, gridStyles }
