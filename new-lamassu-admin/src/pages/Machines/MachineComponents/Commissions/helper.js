import React from 'react'

import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'

const cashInAndOutHeaderStyle = { marginLeft: 6 }

const cashInHeader = (
  <div>
    <TxInIcon />
    <span style={cashInAndOutHeaderStyle}>Cash-in</span>
  </div>
)

const cashOutHeader = (
  <div>
    <TxOutIcon />
    <span style={cashInAndOutHeaderStyle}>Cash-out</span>
  </div>
)

const getOverridesFields = currency => {
  return [
    {
      name: 'name',
      width: 280,
      size: 'sm',
      view: it => `${it}`
    },
    {
      header: cashInHeader,
      name: 'cashIn',
      display: 'Cash-in',
      width: 130,
      textAlign: 'right',
      suffix: '%'
    },
    {
      header: cashOutHeader,
      name: 'cashOut',
      display: 'Cash-out',
      width: 130,
      textAlign: 'right',
      suffix: '%',
      inputProps: {
        decimalPlaces: 3
      }
    },
    {
      name: 'fixedFee',
      display: 'Fixed fee',
      width: 144,
      doubleHeader: 'Cash-in only',
      textAlign: 'right',
      suffix: currency
    },
    {
      name: 'minimumTx',
      display: 'Minimun Tx',
      width: 144,
      doubleHeader: 'Cash-in only',
      textAlign: 'right',
      suffix: currency
    }
  ]
}

const overrides = currency => {
  return getOverridesFields(currency)
}

export { overrides }
