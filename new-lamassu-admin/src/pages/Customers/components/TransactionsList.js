import { makeStyles } from '@material-ui/core/styles'
import BigNumber from 'bignumber.js'
import moment from 'moment'
import * as R from 'ramda'
import React from 'react'

import DataTable from 'src/components/tables/DataTable'
import { H4, Label2 } from 'src/components/typography'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { toUnit } from 'src/utils/coin'

import CopyToClipboard from '../../Transactions/CopyToClipboard'
import mainStyles from '../CustomersList.styles'

const useStyles = makeStyles(mainStyles)

const TransactionsList = ({ data }) => {
  const classes = useStyles()
  const hasData = !(R.isEmpty(data) || R.isNil(data))

  const elements = [
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
          {it.txClass === 'cashOut' ? 'Cach-out' : 'Cash-in'}
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
      view: it => moment.utc(it.created).format('YYYY-MM-D')
    },
    {
      header: 'Time (h:m:s)',
      width: 134,
      view: it => moment.utc(it.created).format('hh:mm:ss')
    }
  ]

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <H4>
            {hasData
              ? 'All transactions from this customer'
              : 'No transactions so far'}
          </H4>
        </div>
      </div>
      {hasData && <DataTable elements={elements} data={data} />}
    </>
  )
}

export default TransactionsList
