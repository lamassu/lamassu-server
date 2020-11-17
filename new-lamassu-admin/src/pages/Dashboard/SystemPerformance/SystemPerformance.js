import { useQuery } from '@apollo/react-hooks'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import moment from 'moment'
import * as R from 'ramda'
import React, { useState } from 'react'
import { Label2 } from 'src/components/typography/index'
import { ReactComponent as TriangleDown } from 'src/styling/icons/arrow/triangle_down.svg'
import { ReactComponent as TriangleUp } from 'src/styling/icons/arrow/triangle_up.svg'
import { fromNamespace } from 'src/utils/config'

import PercentageChart from './Graphs/PercentageChart'
import LineChart from './Graphs/RefLineChart'
import Scatterplot from './Graphs/RefScatterplot'
import InfoWithLabel from './InfoWithLabel'
import Nav from './Nav'
import styles from './SystemPerformance.styles'

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_HALF_UP })

const getFiats = R.map(R.prop('fiat'))
const useStyles = makeStyles(styles)
const mapToFee = R.map(R.prop('cashInFee'))

const getDateSecondsAgo = (seconds = 0, startDate = null) => {
  const date = startDate ? moment(startDate) : moment()
  return date.subtract(seconds, 'second')
}

const ranges = {
  Day: {
    left: getDateSecondsAgo(2 * 24 * 3600, moment()),
    right: getDateSecondsAgo(24 * 3600, moment())
  },
  Week: {
    left: getDateSecondsAgo(14 * 24 * 3600, moment()),
    right: getDateSecondsAgo(7 * 24 * 3600, moment())
  },
  Month: {
    left: getDateSecondsAgo(60 * 24 * 3600, moment()),
    right: getDateSecondsAgo(30 * 24 * 3600, moment())
  }
}

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
    fiatRates {
      code
      name
      rate
    }
    config
  }
`

const reducer = (acc, it) =>
  (acc +=
    Number.parseFloat(it.commissionPercentage) * Number.parseFloat(it.fiat))

const SystemPerformance = () => {
  const classes = useStyles()
  const [selectedRange, setSelectedRange] = useState('Day')
  const { data, loading } = useQuery(GET_DATA)
  const fiatLocale = fromNamespace('locale')(data?.config).fiatCurrency

  const isInRangeAndNoError = getLastTimePeriod => t => {
    if (t.error !== null) return false
    if (!getLastTimePeriod) {
      return (
        t.error === null &&
        moment(t.created).isBetween(ranges[selectedRange].right, moment())
      )
    }
    return (
      t.error === null &&
      moment(t.created).isBetween(
        ranges[selectedRange].left,
        ranges[selectedRange].right
      )
    )
  }

  const convertFiatToLocale = item => {
    if (item.fiatCode === fiatLocale) return item
    const itemRate = R.find(R.propEq('code', item.fiatCode))(data.fiatRates)
    const localeRate = R.find(R.propEq('code', fiatLocale))(data.fiatRates)
    const multiplier = localeRate.rate / itemRate.rate
    return { ...item, fiat: parseFloat(item.fiat) * multiplier }
  }

  const transactionsToShow = R.map(convertFiatToLocale)(
    R.filter(isInRangeAndNoError(false), data?.transactions ?? [])
  )
  const transactionsLastTimePeriod = R.map(convertFiatToLocale)(
    R.filter(isInRangeAndNoError(true), data?.transactions ?? [])
  )

  const getNumTransactions = () => {
    return R.length(transactionsToShow)
  }

  const getFiatVolume = () =>
    new BigNumber(R.sum(getFiats(transactionsToShow)))
      .decimalPlaces(2)
      .toNumber()

  const getProfit = transactions => {
    const cashInFees = R.sum(mapToFee(transactions))
    const commissionFees = R.reduce(reducer, 0, transactions)

    return new BigNumber(commissionFees + cashInFees)
      .decimalPlaces(2)
      .toNumber()
  }

  const getPercentChange = () => {
    const thisTimePeriodProfit = getProfit(transactionsToShow)
    const previousTimePeriodProfit = getProfit(transactionsLastTimePeriod)

    if (previousTimePeriodProfit === 0) return 100

    return Math.round(
      (100 * (thisTimePeriodProfit - previousTimePeriodProfit)) /
        Math.abs(previousTimePeriodProfit)
    )
  }

  const getDirectionPercent = () => {
    const [cashIn, cashOut] = R.partition(R.propEq('txClass', 'cashIn'))(
      transactionsToShow
    )
    const totalLength = cashIn.length + cashOut.length
    if (totalLength === 0) {
      return { cashIn: 0, cashOut: 0 }
    }

    return {
      cashIn: Math.round((cashIn.length / totalLength) * 100),
      cashOut: Math.round((cashOut.length / totalLength) * 100)
    }
  }

  const percentChange = getPercentChange()

  return (
    <>
      <Nav handleSetRange={setSelectedRange} />
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
          <Grid container className={classes.gridContainer}>
            <Grid item xs={12}>
              <Label2>Transactions</Label2>
              <Scatterplot
                timeFrame={selectedRange}
                data={transactionsToShow}
              />
            </Grid>
          </Grid>
          <Grid container className={classes.gridContainer}>
            <Grid item xs={8}>
              <Label2>Profit from commissions</Label2>
              <div className={classes.profitContainer}>
                <div className={classes.profitLabel}>
                  {`${getProfit(transactionsToShow)} ${
                    data?.config.locale_fiatCurrency
                  }`}
                </div>
                <div
                  className={
                    percentChange <= 0 ? classes.percentDown : classes.percentUp
                  }>
                  {percentChange <= 0 ? (
                    <TriangleDown className={classes.percentDown} />
                  ) : (
                    <TriangleUp className={classes.percentUp} />
                  )}{' '}
                  {`${percentChange}%`}
                </div>
              </div>
              <LineChart timeFrame={selectedRange} data={transactionsToShow} />
            </Grid>
            <Grid item xs={4}>
              <Label2>Direction</Label2>
              <Grid container>
                <Grid item xs>
                  <PercentageChart
                    cashIn={getDirectionPercent().cashIn}
                    cashOut={getDirectionPercent().cashOut}
                  />
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
