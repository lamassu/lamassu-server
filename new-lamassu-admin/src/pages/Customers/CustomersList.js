import { makeStyles } from '@material-ui/core/styles'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import moment from 'moment'
import * as R from 'ramda'
import React from 'react'

import { MainStatus } from 'src/components/Status'
import TitleSection from 'src/components/layout/TitleSection'
import DataTable from 'src/components/tables/DataTable'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { ifNotNull } from 'src/utils/nullCheck'

import styles from './CustomersList.styles'

const useStyles = makeStyles(styles)

const CUSTOMER_VERIFIED = 'verified'
const CUSTOMER_BLOCKED = 'blocked'

const CustomersList = ({ data, locale, onClick, loading }) => {
  const classes = useStyles()

  const getAuthorizedStatus = authorizedOverride =>
    authorizedOverride === CUSTOMER_VERIFIED
      ? { label: 'Authorized', type: 'success' }
      : authorizedOverride === CUSTOMER_BLOCKED
      ? { label: 'Blocked', type: 'error' }
      : { label: 'Suspended', type: 'warning' }

  const elements = [
    {
      header: 'Name',
      width: 241,
      view: R.path(['name'])
    },
    {
      header: 'Phone',
      width: 172,
      view: it =>
        it.phone && locale.country
          ? parsePhoneNumberFromString(
              it.phone,
              locale.country
            ).formatInternational()
          : ''
    },
    {
      header: 'Total TXs',
      width: 126,
      textAlign: 'right',
      view: it => `${Number.parseInt(it.totalTxs)}`
    },
    {
      header: 'Total spent',
      width: 152,
      textAlign: 'right',
      view: it =>
        `${Number.parseFloat(it.totalSpent)} ${it.lastTxFiatCode ?? ''}`
    },
    {
      header: 'Last active',
      width: 133,
      view: it =>
        ifNotNull(it.lastActive, moment.utc(it.lastActive).format('YYYY-MM-D'))
    },
    {
      header: 'Last transaction',
      width: 161,
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
      width: 188,
      view: it => (
        <MainStatus statuses={[getAuthorizedStatus(it.authorizedOverride)]} />
      )
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
