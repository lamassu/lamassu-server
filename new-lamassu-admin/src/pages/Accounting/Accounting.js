import { makeStyles } from '@material-ui/core/styles'
import moment from 'moment'
import React from 'react'

import { Tooltip } from 'src/components/Tooltip'
import TitleSection from 'src/components/layout/TitleSection'
import DataTable from 'src/components/tables/DataTable'
import { H4, Info2, P } from 'src/components/typography'

import styles from './Accounting.styles'

const mockData = [
  {
    operation: 'Hedging summary',
    direction: 'in',
    extraInfo: 'This is mocked information',
    amount: 486,
    currency: 'USD',
    balanceAfterTx: 10438,
    date: '2021-02-22T20:16:12.020Z'
  },
  {
    operation: 'Funding transaction',
    direction: 'in',
    amount: 2000,
    currency: 'USD',
    balanceAfterTx: 9952,
    date: '2021-02-22T12:40:32.020Z'
  },
  {
    operation: 'ZEC hot wallet top up',
    direction: 'out',
    amount: 1000,
    currency: 'USD',
    balanceAfterTx: 7952,
    date: '2021-02-21T16:30:44.020Z'
  },
  {
    operation: 'Funding transaction',
    direction: 'in',
    amount: 8000,
    currency: 'USD',
    balanceAfterTx: 8952,
    date: '2021-02-21T08:16:20.020Z'
  }
]

const useStyles = makeStyles(styles)

const Assets = ({ balance, hedgingReserve, currency }) => {
  const classes = useStyles()

  return (
    <div className={classes.totalAssetWrapper}>
      <div className={classes.totalAssetFieldWrapper}>
        <P className={classes.fieldHeader}>Pazuz fiat balance</P>
        <div className={classes.totalAssetWrapper}>
          <Info2 noMargin className={classes.fieldValue}>
            {balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </Info2>
          <Info2 noMargin className={classes.fieldCurrency}>
            {currency}
          </Info2>
        </div>
      </div>
      <Info2 className={classes.separator}>-</Info2>
      <div className={classes.totalAssetFieldWrapper}>
        <P className={classes.fieldHeader}>Hedging reserve</P>
        <div className={classes.totalAssetWrapper}>
          <Info2 noMargin className={classes.fieldValue}>
            {hedgingReserve.toLocaleString('en-US', {
              maximumFractionDigits: 2
            })}
          </Info2>
          <Info2 noMargin className={classes.fieldCurrency}>
            {currency}
          </Info2>
        </div>
      </div>
      <Info2 className={classes.separator}>=</Info2>
      <div className={classes.totalAssetFieldWrapper}>
        <P className={classes.fieldHeader}>Available balance</P>
        <div className={classes.totalAssetWrapper}>
          <Info2 noMargin className={classes.fieldValue}>
            {(balance - hedgingReserve).toLocaleString('en-US', {
              maximumFractionDigits: 2
            })}
          </Info2>
          <Info2 noMargin className={classes.fieldCurrency}>
            {currency}
          </Info2>
        </div>
      </div>
    </div>
  )
}

const Accounting = () => {
  const classes = useStyles()

  const elements = [
    {
      header: 'Operation',
      width: 500,
      size: 'sm',
      textAlign: 'left',
      view: it => {
        return (
          <span className={classes.operation}>
            {it.operation}
            {!!it.extraInfo && (
              <Tooltip width={175}>
                <P>{it.extraInfo}</P>
              </Tooltip>
            )}
          </span>
        )
      }
    },
    {
      header: 'Amount',
      width: 147,
      size: 'sm',
      textAlign: 'right',
      view: it =>
        `${it.direction === 'in' ? it.amount : -it.amount} ${it.currency}`
    },
    {
      header: 'Balance after operation',
      width: 250,
      size: 'sm',
      textAlign: 'right',
      view: it => `${it.balanceAfterTx} ${it.currency}`
    },
    {
      header: 'Date',
      width: 150,
      size: 'sm',
      textAlign: 'right',
      view: it => moment.utc(it.created).format('YYYY-MM-DD')
    },
    {
      header: 'Time',
      width: 150,
      size: 'sm',
      textAlign: 'right',
      view: it => moment.utc(it.created).format('HH:mm:ss')
    }
  ]

  return (
    <>
      <TitleSection title="Accounting" />
      <Assets balance={10438} hedgingReserve={1486} currency={'USD'} />
      <H4 className={classes.tableTitle}>Fiat balance history</H4>
      <DataTable
        loading={false}
        emptyText="No transactions so far"
        elements={elements}
        data={mockData}
        rowSize="sm"
      />
    </>
  )
}

export default Accounting
