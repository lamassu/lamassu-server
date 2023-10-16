import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useContext } from 'react'

import AppContext from 'src/AppContext'
import { HoverableTooltip } from 'src/components/Tooltip'
import TitleSection from 'src/components/layout/TitleSection'
import DataTable from 'src/components/tables/DataTable'
import { H4, Info2, P } from 'src/components/typography'
import { numberToFiatAmount } from 'src/utils/number'
import { formatDate } from 'src/utils/timezones'

import styles from './Accounting.styles'

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
      assets
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

const GET_DATA = gql`
  query getData {
    config
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
            {numberToFiatAmount(balance)}
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
            {numberToFiatAmount(hedgingReserve)}
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
            {numberToFiatAmount(balance - hedgingReserve)}
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

  const { data: opData, loading: operatorLoading } = useQuery(
    GET_OPERATOR_BY_USERNAME,
    {
      context: { clientName: 'pazuz' },
      variables: { username: userData?.username }
    }
  )

  const { data: configResponse, loading: configLoading } = useQuery(GET_DATA)
  const timezone = R.path(['config', 'locale_timezone'], configResponse)

  const loading = operatorLoading || configLoading

  const operatorData = R.path(['operatorByUsername'], opData)

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
              <HoverableTooltip width={175}>
                <P>{it.extraInfo}</P>
              </HoverableTooltip>
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
        `${numberToFiatAmount(it.fiatAmount)} ${R.toUpper(it.fiatCurrency)}`
    },
    {
      header: 'Balance after operation',
      width: 250,
      size: 'sm',
      textAlign: 'right',
      view: it =>
        `${numberToFiatAmount(it.fiatBalanceAfter)} ${R.toUpper(
          it.fiatCurrency
        )}`
    },
    {
      header: 'Date',
      width: 150,
      size: 'sm',
      textAlign: 'right',
      view: it => formatDate(it.created, timezone, 'yyyy-MM-dd')
    },
    {
      header: 'Time',
      width: 150,
      size: 'sm',
      textAlign: 'right',
      view: it => formatDate(it.created, timezone, 'yyyy-MM-dd')
    }
  ]

  const hedgingReserve = BigNumber(
    R.reduce(
      (acc, value) => acc.plus(value),
      BigNumber(0),
      R.values(operatorData?.assets.values.hedgedContracts) ?? []
    ) ?? 0
  ).toNumber()

  return (
    !loading && (
      <>
        <TitleSection title="Accounting" />
        <Assets
          balance={operatorData?.assets.total ?? 0}
          hedgingReserve={hedgingReserve}
          currency={operatorData?.preferredFiatCurrency ?? ''}
        />
        <H4 className={classes.tableTitle}>Fiat balance history</H4>
        <DataTable
          loading={loading}
          emptyText="No transactions so far"
          elements={elements}
          data={operatorData?.fundings ?? []}
          rowSize="sm"
        />
      </>
    )
  )
}

export default Accounting
