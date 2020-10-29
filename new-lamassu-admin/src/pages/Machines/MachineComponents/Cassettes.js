import { makeStyles } from '@material-ui/core'
import React from 'react'
import * as Yup from 'yup'

import { Table as EditableTable } from 'src/components/editableTable'
import { CashOut } from 'src/components/inputs/cashbox/Cashbox'
import { fromNamespace } from 'src/utils/config'

import styles from './Cassettes.styles.js'

const useStyles = makeStyles(styles)

const ValidationSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  cassette1: Yup.number()
    .required('Required')
    .integer()
    .min(0)
    .max(500),
  cassette2: Yup.number()
    .required('Required')
    .integer()
    .min(0)
    .max(500)
})

const CashCassettes = ({ machine, config }) => {
  const data = { machine, config }
  const classes = useStyles()

  const cashout = data?.config && fromNamespace('cashOut')(data.config)
  const locale = data?.config && fromNamespace('locale')(data.config)
  const fiatCurrency = locale?.fiatCurrency

  const getCashoutSettings = id => fromNamespace(id)(cashout)
  // const isCashOutDisabled = ({ id }) => !getCashoutSettings(id).active

  const elements = [
    {
      name: 'cassette1',
      header: 'Cash-out 1',
      width: 265,
      stripe: true,
      view: (value, { id }) => (
        <CashOut
          className={classes.cashbox}
          denomination={getCashoutSettings(id)?.bottom}
          currency={{ code: fiatCurrency }}
          notes={value}
        />
      )
    },
    {
      name: 'cassette2',
      header: 'Cash-out 2',
      width: 265,
      stripe: true,
      view: (value, { id }) => (
        <CashOut
          className={classes.cashbox}
          denomination={getCashoutSettings(id)?.top}
          currency={{ code: fiatCurrency }}
          notes={value}
        />
      )
    }
  ]

  return (
    <>
      {machine.name && (
        <EditableTable
          name="cashboxes"
          elements={elements}
          data={[machine] || []}
          validationSchema={ValidationSchema}
        />
      )}
    </>
  )
}

export default CashCassettes
