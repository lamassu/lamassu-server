import { makeStyles } from '@material-ui/core/styles'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import moment from 'moment'
import * as R from 'ramda'
import React from 'react'

import TitleSection from 'src/components/layout/TitleSection'
import DataTable from 'src/components/tables/DataTable'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { ifNotNull } from 'src/utils/nullCheck'

import styles from './CustomersList.styles'

const useStyles = makeStyles(styles)

const CustomersList = ({ data, onClick, loading }) => {
  const classes = useStyles()

  const elements = [
    {
      header: 'Phone',
      width: 186,
      view: it => parsePhoneNumberFromString(it.phone).formatInternational()
    },
    {
      header: 'Name',
      width: 277,
      view: R.path(['name'])
    },
    {
      header: 'Total TXs',
      width: 154,
      textAlign: 'right',
      view: it => `${Number.parseInt(it.totalTxs)}`
    },
    {
      header: 'Total spent',
      width: 188,
      textAlign: 'right',
      view: it =>
        `${Number.parseFloat(it.totalSpent)} ${it.lastTxFiatCode ?? ''}`
    },
    {
      header: 'Last active',
      width: 197,
      view: it =>
        ifNotNull(it.lastActive, moment.utc(it.lastActive).format('YYYY-MM-D'))
    },
    {
      header: 'Last transaction',
      width: 198,
      textAlign: 'right',
      view: it => {
        const hasLastTx = !R.isNil(it.lastTxFiatCode)
        const LastTxIcon = it.lastTxClass === 'cashOut' ? TxOutIcon : TxInIcon
        const lastIcon = <LastTxIcon className={classes.txClassIconRight} />
        return (
          <>
            {hasLastTx &&
              `${parseFloat(it.lastTxFiat)} ${it.lastTxFiatCode ?? ''}`}
            {hasLastTx && lastIcon}
          </>
        )
      }
    }
  ]

  return (
    <>
      <TitleSection
        title="Customers"
        labels={[
          { label: 'Cash-in', icon: <TxInIcon /> },
          { label: 'Cash-out', icon: <TxOutIcon /> }
        ]}
      />
      <DataTable
        loading={loading}
        emptyText="No customers so far"
        elements={elements}
        data={data}
        onClick={onClick}
      />
    </>
  )
}

export default CustomersList
