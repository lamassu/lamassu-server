import { makeStyles, Box } from '@material-ui/core'
import BigNumber from 'bignumber.js'
import classnames from 'classnames'
import { utils as coinUtils } from 'lamassu-coins'
import * as R from 'ramda'
import React from 'react'

import DataTable from 'src/components/tables/DataTable'
import { H3, H4, Label1, Label2, P } from 'src/components/typography'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
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
  const tableSpacingClasses = {
    [classes.titleAndButtonsContainer]: loading || (!loading && !hasData),
    [classes.txTableSpacing]: !loading && hasData
  }

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
          formatDate(customer.lastActive, timezone, 'YYYY-MM-D')
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
      width: 75,
      view: it => (
        <>
          {it.txClass === 'cashOut' ? (
            <TxOutIcon className={classes.txClassIconLeft} />
          ) : (
            <TxInIcon className={classes.txClassIconLeft} />
          )}
        </>
      )
    },
    {
      header: 'Transaction ID',
      width: 175,
      view: it => (
        <CopyToClipboard className={classes.txId}>{it.id}</CopyToClipboard>
      )
    },
    {
      header: 'Cash',
      width: 175,
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
      width: 175,
      textAlign: 'right',
      view: it => (
        <>
          {`${coinUtils
            .toUnit(new BigNumber(it.cryptoAtoms), it.cryptoCode)
            .toFormat(5)} `}
          <Label2 inline>{it.cryptoCode}</Label2>
        </>
      )
    },
    {
      header: 'Date',
      width: 160,
      view: it => formatDate(it.created, timezone, 'YYYY-MM-D')
    },
    {
      header: 'Time (h:m:s)',
      width: 134,
      view: it => formatDate(it.created, timezone, 'HH:mm:ss')
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
              className={classes.txSummaryLabel}
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
              className={classes.txSummaryValue}
              style={{ width: size }}>
              {value}
            </P>
          ))}
        </Box>
      </Box>
      <div className={classes.titleWrapper}>
        <div className={classnames(tableSpacingClasses)}>
          {loading ? (
            <H4>Loading</H4>
          ) : hasData ? (
            ''
          ) : (
            <H4>No transactions so far</H4>
          )}
        </div>
      </div>
      {hasData && <DataTable elements={tableElements} data={data} />}
    </>
  )
}

export default TransactionsList
