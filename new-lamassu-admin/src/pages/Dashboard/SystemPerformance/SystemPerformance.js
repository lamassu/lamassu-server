/* eslint-disable */
import { makeStyles } from '@material-ui/core/styles'
import styles from './SystemPerformance.styles'

import { useQuery } from '@apollo/react-hooks'
import Grid from '@material-ui/core/Grid'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React, { useState, useEffect } from 'react'

import { Label1, Label2 } from 'src/components/typography/index'
import { fromNamespace } from 'src/utils/config'

import LineChart from './Graphs/RefLineChart'
import Scatterplot from './Graphs/RefScatterplot'
import InfoWithLabel from './InfoWithLabel'
import Nav from './Nav'

const isNotProp = R.curry(R.compose(R.isNil, R.prop))
const getFiats = R.map(R.prop('fiat'))
const getProps = propName => R.map(R.prop(propName))
const useStyles = makeStyles(styles)
const getDateDaysAgo = (days = 0) => {
  return moment().subtract(days, 'day')
}

// const now = moment()

const GET_DATA = gql`
query getData {
  transactions {
    fiatCode
    fiat
    cashInFee
    commissionPercentage
    created
    txClass
    error
  }
  btcRates {
    code
    name
    rate
  }
  config
}
`

const currentTime = new Date()

const SystemPerformance = () => {
  const classes = useStyles()

  const [selectedRange, setSelectedRange] = useState('Day')
  const [transactionsToShow, setTransactionsToShow] = useState([])
  const [transactionsLastTimePeriod, setTransactionsLastTimePeriod] = useState([])
  
  const { data, loading } = useQuery(GET_DATA)

  const fiatLocale = fromNamespace('locale')(data?.config).fiatCurrency

  useEffect(() => {
    const isInRange = (getLastTimePeriod = false) => t => {
      const now = moment(currentTime)
      switch (selectedRange) {
        case 'Day':
          if(getLastTimePeriod) {
            return (
              t.error === null &&
              moment(t.created).isBetween(getDateDaysAgo(2), now.subtract(25, "hours"))
            )
          }
          return (
            t.error === null &&
            moment(t.created).isBetween(getDateDaysAgo(1), now)
          )
        case 'Week':
          if(getLastTimePeriod) {
            return (
              t.error === null &&
              moment(t.created).isBetween(getDateDaysAgo(14), now.subtract(24 * 7 + 1, "hours"))
            )
          }
          return (
            t.error === null &&
            moment(t.created).isBetween(getDateDaysAgo(7), now)
          )
        case 'Month':
          if(getLastTimePeriod) {
            return (
              t.error === null &&
              moment(t.created).isBetween(getDateDaysAgo(60), now.subtract(24 * 30 + 1, "hours"))
            )
          }
          return (
            t.error === null &&
            moment(t.created).isBetween(getDateDaysAgo(30), now)
          )
        default:
          return t.error === null && true
      }
    }

    const convertFiatToLocale = item => {
      if (item.fiatCode === fiatLocale) return item
      const itemRate = R.find(R.propEq('code', item.fiatCode))(data.btcRates)
      const localeRate = R.find(R.propEq('code', fiatLocale))(data.btcRates)
      const multiplier = localeRate.rate / itemRate.rate
      return { ...item, fiat: parseFloat(item.fiat) * multiplier }
    }

    setTransactionsToShow(R.map(convertFiatToLocale)(R.filter(isInRange(false), data?.transactions ?? [])))
    setTransactionsLastTimePeriod(R.map(convertFiatToLocale)(R.filter(isInRange(true), data?.transactions ?? [])))
  }, [data, fiatLocale, selectedRange])

  const handleSetRange = range => {
    setSelectedRange(range)
  }

  const getNumTransactions = () => {
    return R.length(R.filter(isNotProp('error'), transactionsToShow))
  }

  const getFiatVolume = () => {
    // for explanation check https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
    return +(
      Math.round(
        R.sum(getFiats(R.filter(isNotProp('error'), transactionsToShow))) +
          'e+2'
      ) + 'e-2'
    )
  }

  const getProfit = (transactions = transactionsToShow) => {
    const cashInFees = R.sum(
      getProps('cashInFee')(R.filter(isNotProp('error'), transactions))
    )
    let commissionFees = 0
    transactions.forEach(t => {
      if (t.error === null) {
        commissionFees +=
          Number.parseFloat(t.commissionPercentage) * Number.parseFloat(t.fiat)
      }
    })
    return +(Math.round(commissionFees + cashInFees + 'e+2') + 'e-2')
  }

  const getPercentChange = () => {
    const thisTimePeriodProfit = getProfit(transactionsToShow)
    const previousTimePeriodProfit = getProfit(transactionsLastTimePeriod)
    if(previousTimePeriodProfit === 0) {
      return 100
    }
    return Math.round(100 * (thisTimePeriodProfit - previousTimePeriodProfit) / Math.abs(previousTimePeriodProfit))
  }

  const getDirectionPercent = () => {
    const directions = {
      cashIn: 0,
      cashOut: 0,
      length: 0
    }
    transactionsToShow.forEach(t => {
      if (t.error === null) {
        switch (t.txClass) {
          case 'cashIn':
            directions.cashIn += 1
            directions.length += 1
            break
          case 'cashOut':
            directions.cashOut += 1
            directions.length += 1
            break
          default:
            break
        }
      }
    })
    return {
      cashIn:
        directions.length > 0
          ? Math.round((directions.cashIn / directions.length) * 100)
          : 0,
      cashOut:
        directions.length > 0
          ? Math.round((directions.cashOut / directions.length) * 100)
          : 0
    }
  }

  return (
    <>
      <Nav handleSetRange={handleSetRange} />
      {!loading && (
        <>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <InfoWithLabel
                info={getNumTransactions()}
                label={'transactions'}
              />
            </Grid>
            <Grid item xs={3}>
              <InfoWithLabel
                info={getFiatVolume()}
                label={`${data?.config.locale_fiatCurrency} volume`}
              />
            </Grid>
            {/* todo new customers */}
          </Grid>
          <Grid container style={{ marginTop: 30 }}>
            <Grid item xs={12}>
              <Label2>Transactions</Label2>
              <Scatterplot
                timeFrame={selectedRange}
                data={transactionsToShow}
              />
            </Grid>
          </Grid>
          <Grid container style={{ marginTop: 30 }}>
            <Grid item xs={8}>
              <Label2>Profit from commissions</Label2>
              <div style={{display: "flex", justifyContent: "space-between", margin: "0 26px -30px 16px", position: "relative"}}>
              {`${getProfit()} ${data?.config.locale_fiatCurrency}`}
              <div className={classes.percentChangeLabel}>
              {`${getPercentChange()}%`}
              </div>
              </div>
              <LineChart timeFrame={selectedRange} data={transactionsToShow} />
            </Grid>
            <Grid item xs={4}>
              <Label2>Direction</Label2>
              <Grid container>
                <Grid item xs={6}>
                  <Label1>CashIn: </Label1>
                  {` ${getDirectionPercent().cashIn}%`}
                </Grid>
                <Grid item xs={6}>
                  <Label1>CashOut: </Label1>
                  {` ${getDirectionPercent().cashOut}%`}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </>
      )}
    </>
  )
}

export default SystemPerformance
