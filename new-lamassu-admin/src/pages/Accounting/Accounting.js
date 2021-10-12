import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React, { useContext } from 'react'

import AppContext from 'src/AppContext'
import { Tooltip } from 'src/components/Tooltip'
import TitleSection from 'src/components/layout/TitleSection'
import DataTable from 'src/components/tables/DataTable'
import { H4, Info2, P } from 'src/components/typography'

import styles from './Accounting.styles'

const formatCurrency = amount =>
  amount.toLocaleString('en-US', { maximumFractionDigits: 2 })

const useStyles = makeStyles(styles)

const GET_OPERATOR_BY_USERNAME = gql`
  query operatorByUsername($username: String) {
    operatorByUsername(username: $username) {
      id
      entityId
      name
      fiatBalances
      cryptoBalances
      machines
      joined
      assetValue
      preferredFiatCurrency
      contactInfo {
        name
        email
      }
      fundings {
        id
        origin
        destination
        fiatAmount
        fiatBalanceAfter
        fiatCurrency
        created
        status
        description
      }
    }
  }
`

const Assets = ({ balance, hedgingReserve, currency }) => {
  const classes = useStyles()

  return (
    <div className={classes.totalAssetWrapper}>
      <div className={classes.totalAssetFieldWrapper}>
        <P className={classes.fieldHeader}>Pazuz fiat balance</P>
        <div className={classes.totalAssetWrapper}>
          <Info2 noMargin className={classes.fieldValue}>
            {formatCurrency(balance)}
          </Info2>
          <Info2 noMargin className={classes.fieldCurrency}>
            {R.toUpper(currency)}
          </Info2>
        </div>
      </div>
      <Info2 className={classes.separator}>-</Info2>
      <div className={classes.totalAssetFieldWrapper}>
        <P className={classes.fieldHeader}>Hedging reserve</P>
        <div className={classes.totalAssetWrapper}>
          <Info2 noMargin className={classes.fieldValue}>
            {formatCurrency(hedgingReserve)}
          </Info2>
          <Info2 noMargin className={classes.fieldCurrency}>
            {R.toUpper(currency)}
          </Info2>
        </div>
      </div>
      <Info2 className={classes.separator}>=</Info2>
      <div className={classes.totalAssetFieldWrapper}>
        <P className={classes.fieldHeader}>Available balance</P>
        <div className={classes.totalAssetWrapper}>
          <Info2 noMargin className={classes.fieldValue}>
            {formatCurrency(balance - hedgingReserve)}
          </Info2>
          <Info2 noMargin className={classes.fieldCurrency}>
            {R.toUpper(currency)}
          </Info2>
        </div>
      </div>
    </div>
  )
}

const Accounting = () => {
  const classes = useStyles()
  const { userData } = useContext(AppContext)

  const { data, loading } = useQuery(GET_OPERATOR_BY_USERNAME, {
    context: { clientName: 'pazuz' },
    variables: { username: userData?.username }
  })

  const operatorData = R.path(['operatorByUsername'], data)

  const elements = [
    {
      header: 'Operation',
      width: 500,
      size: 'sm',
      textAlign: 'left',
      view: it => {
        return (
          <span className={classes.operation}>
            {it.description}
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
        `${formatCurrency(it.fiatAmount)} ${R.toUpper(it.fiatCurrency)}`
    },
    {
      header: 'Balance after operation',
      width: 250,
      size: 'sm',
      textAlign: 'right',
      view: it =>
        `${formatCurrency(it.fiatBalanceAfter)} ${R.toUpper(it.fiatCurrency)}`
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
    !loading && (
      <>
        <TitleSection title="Accounting" />
        <Assets
          balance={
            operatorData.fiatBalances[operatorData.preferredFiatCurrency]
          }
          hedgingReserve={operatorData.hedgingReserve ?? 0}
          currency={operatorData.preferredFiatCurrency}
        />
        <H4 className={classes.tableTitle}>Fiat balance history</H4>
        <DataTable
          loading={false}
          emptyText="No transactions so far"
          elements={elements}
          data={operatorData.fundings ?? []}
          rowSize="sm"
        />
      </>
    )
  )
}

export default Accounting
