import { makeStyles, Box } from '@material-ui/core'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import React from 'react'

import DataTable from 'src/components/tables/DataTable'
import { H3, H4, Label1, Label2, P } from 'src/components/typography'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { toUnit } from 'src/utils/coin'
import { ifNotNull } from 'src/utils/nullCheck'
import { formatDate } from 'src/utils/timezones'

import CopyToClipboard from '../../Transactions/CopyToClipboard'
import mainStyles from '../CustomersList.styles'

const useStyles = makeStyles(mainStyles)

const TransactionsList = ({ customer, data, loading, locale }) => {
  const classes = useStyles()
  const LastTxIcon = customer.lastTxClass === 'cashOut' ? TxOutIcon : TxInIcon
  const hasData = !(R.isEmpty(data) || R.isNil(data))

  const timezone = locale.timezone

  const summaryElements = [
    {
      header: 'Transactions',
      size: 127,
      value: ifNotNull(
        customer.totalTxs,
        `${Number.parseInt(customer.totalTxs)}`
      )
    },
    {
      header: 'Transaction volume',
      size: 167,
      value: ifNotNull(
        customer.totalSpent,
        `${Number.parseFloat(customer.totalSpent)} ${customer.lastTxFiatCode}`
      )
    },
    {
      header: 'Last active',
      size: 142,
      value:
        !R.isNil(timezone) &&
        ifNotNull(
          customer.lastActive,
          formatDate(customer.lastActive, timezone.dstOffset, 'YYYY-MM-D')
        )
    },
    {
      header: 'Last transaction',
      size: 198,
      value: ifNotNull(
        customer.lastTxFiat,
        <>
          <LastTxIcon className={classes.icon} />
          {`${Number.parseFloat(customer.lastTxFiat)} 
            ${customer.lastTxFiatCode}`}
        </>
      )
    }
  ]

  const tableElements = [
    {
      header: 'Direction',
      width: 207,
      view: it => (
        <>
          {it.txClass === 'cashOut' ? (
            <TxOutIcon className={classes.txClassIconLeft} />
          ) : (
            <TxInIcon className={classes.txClassIconLeft} />
          )}
          {it.txClass === 'cashOut' ? 'Cash-out' : 'Cash-in'}
        </>
      )
    },
    {
      header: 'Transaction ID',
      width: 414,
      view: it => (
        <CopyToClipboard className={classes.txId}>{it.id}</CopyToClipboard>
      )
    },
    {
      header: 'Cash',
      width: 146,
      textAlign: 'right',
      view: it => (
        <>
          {`${Number.parseFloat(it.fiat)} `}
          <Label2 inline>{it.fiatCode}</Label2>
        </>
      )
    },
    {
      header: 'Crypto',
      width: 142,
      textAlign: 'right',
      view: it => (
        <>
          {`${toUnit(new BigNumber(it.cryptoAtoms), it.cryptoCode).toFormat(
            5
          )} `}
          <Label2 inline>{it.cryptoCode}</Label2>
        </>
      )
    },
    {
      header: 'Date',
      width: 157,
      view: it => formatDate(it.created, timezone.dstOffset, 'YYYY-MM-D')
    },
    {
      header: 'Time (h:m:s)',
      width: 134,
      view: it => formatDate(it.created, timezone.dstOffset, 'HH:mm:ss')
    }
  ]

  return (
    <>
      <H3>Transactions</H3>
      <Box display="flex" flexDirection="column">
        <Box display="flex" mt="auto">
          {summaryElements.map(({ size, header }, idx) => (
            <Label1
              noMargin
              key={idx}
              className={classes.label}
              style={{ width: size }}>
              {header}
            </Label1>
          ))}
        </Box>
        <Box display="flex">
          {summaryElements.map(({ size, value }, idx) => (
            <P
              noMargin
              key={idx}
              className={classes.value}
              style={{ width: size }}>
              {value}
            </P>
          ))}
        </Box>
      </Box>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <H4>
            {loading
              ? 'Loading'
              : hasData
              ? 'All transactions from this customer'
              : 'No transactions so far'}
          </H4>
        </div>
      </div>
      {hasData && <DataTable elements={tableElements} data={data} />}
    </>
  )
}

export default TransactionsList
