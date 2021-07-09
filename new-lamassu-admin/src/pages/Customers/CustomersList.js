import { makeStyles } from '@material-ui/core/styles'
import moment from 'moment'
import * as R from 'ramda'
import React from 'react'

import { MainStatus } from 'src/components/Status'
import DataTable from 'src/components/tables/DataTable'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { ifNotNull } from 'src/utils/nullCheck'

import styles from './CustomersList.styles'
import { getAuthorizedStatus, getFormattedPhone, getName } from './helper'

const useStyles = makeStyles(styles)

const CustomersList = ({ data, locale, onClick, loading }) => {
  const classes = useStyles()

  const elements = [
    {
      header: 'Phone',
      width: 175,
      view: it => getFormattedPhone(it.phone, locale.country)
    },
    {
      header: 'Name',
      width: 247,
      view: getName
    },
    {
      header: 'Total TXs',
      width: 130,
      textAlign: 'right',
      view: it => `${Number.parseInt(it.totalTxs)}`
    },
    {
      header: 'Total spent',
      width: 155,
      textAlign: 'right',
      view: it =>
        `${Number.parseFloat(it.totalSpent)} ${it.lastTxFiatCode ?? ''}`
    },
    {
      header: 'Last active',
      width: 137,
      view: it =>
        ifNotNull(it.lastActive, moment.utc(it.lastActive).format('YYYY-MM-D'))
    },
    {
      header: 'Last transaction',
      width: 165,
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
    },
    {
      header: 'Status',
      width: 191,
      view: it => <MainStatus statuses={[getAuthorizedStatus(it)]} />
    }
  ]

  return (
    <>
      <DataTable
        loading={loading}
        emptyText="No customers so far"
        elements={elements}
        data={data}
        width={'1200'}
        onClick={onClick}
      />
    </>
  )
}

export default CustomersList
