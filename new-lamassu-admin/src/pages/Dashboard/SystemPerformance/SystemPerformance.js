import { useQuery } from '@apollo/react-hooks'
import Grid from '@material-ui/core/Grid'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React, { useState, useEffect } from 'react'

import { Label1, Label2 } from 'src/components/typography/index'
import { fromNamespace } from 'src/utils/config'

import Scatterplot from './Graphs/RefScatterplot'
import InfoWithLabel from './InfoWithLabel'
import Nav from './Nav'

const isNotProp = R.curry(R.compose(R.isNil, R.prop))
const getFiats = R.map(R.prop('fiat'))
const getProps = propName => R.map(R.prop(propName))

const getDateDaysAgo = (days = 0) => {
  return moment().subtract(days, 'day')
}
const now = moment()

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

const SystemPerformance = () => {
  const [selectedRange, setSelectedRange] = useState('24 hours')
  const [transactionsToShow, setTransactionsToShow] = useState([])

  const { data, loading } = useQuery(GET_DATA)

  const fiatLocale = fromNamespace('locale')(data?.config).fiatCurrency

  useEffect(() => {
    const isInRange = t => {
      switch (selectedRange) {
        case '24 hours':
          return (
            t.error === null &&
            moment(t.created).isBetween(getDateDaysAgo(1), now)
          )
        case '7 days':
          return (
            t.error === null &&
            moment(t.created).isBetween(getDateDaysAgo(7), now)
          )
        case '30 days':
          return (
            t.error === null &&
            moment(t.created).isBetween(getDateDaysAgo(30), now)
          )
        case '180 days':
          return (
            t.error === null &&
            moment(t.created).isBetween(getDateDaysAgo(180), now)
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

    setTransactionsToShow(
      R.map(convertFiatToLocale)(R.filter(isInRange, data?.transactions ?? []))
    )
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

  const getProfit = () => {
    const cashInFees = R.sum(
      getProps('cashInFee')(R.filter(isNotProp('error'), transactionsToShow))
    )
    let commissionFees = 0
    transactionsToShow.forEach(t => {
      if (t.error === null) {
        commissionFees +=
          Number.parseFloat(t.commissionPercentage) * Number.parseFloat(t.fiat)
      }
    })
    return +(Math.round(commissionFees + cashInFees + 'e+2') + 'e-2')
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
              {`${getProfit()} ${data?.config.locale_fiatCurrency}`}
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
