import { useQuery } from '@apollo/react-hooks'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import BigNumber from 'bignumber.js'
import classnames from 'classnames'
import { isAfter } from 'date-fns/fp'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { EmptyTable } from 'src/components/table'
import { Label1, Label2, P } from 'src/components/typography/index'
import { ReactComponent as PercentDownIcon } from 'src/styling/icons/dashboard/down.svg'
import { ReactComponent as PercentNeutralIcon } from 'src/styling/icons/dashboard/equal.svg'
import { ReactComponent as PercentUpIcon } from 'src/styling/icons/dashboard/up.svg'
import { java, neon } from 'src/styling/variables'
import { fromNamespace } from 'src/utils/config'
import { DAY, WEEK, MONTH } from 'src/utils/time'
import { timezones } from 'src/utils/timezone-list'
import { toTimezone } from 'src/utils/timezones'

import PercentageChart from './Graphs/PercentageChart'
import LineChart from './Graphs/RefLineChart'
import Scatterplot from './Graphs/RefScatterplot'
import InfoWithLabel from './InfoWithLabel'
import Nav from './Nav'
import styles from './SystemPerformance.styles'

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_HALF_UP })

const getFiats = R.map(R.prop('fiat'))
const useStyles = makeStyles(styles)

const GET_DATA = gql`
  query getData($excludeTestingCustomers: Boolean) {
    transactions(excludeTestingCustomers: $excludeTestingCustomers) {
      fiatCode
      fiat
      cashInFee
      commissionPercentage
      created
      txClass
      error
      profit
      dispense
      sendConfirmed
    }
    fiatRates {
      code
      name
      rate
    }
    config
  }
`

const SystemPerformance = () => {
  const classes = useStyles()
  const [selectedRange, setSelectedRange] = useState('Day')
  const { data, loading } = useQuery(GET_DATA, {
    variables: { excludeTestingCustomers: true }
  })
  const fiatLocale = fromNamespace('locale')(data?.config).fiatCurrency
  const timezone = fromNamespace('locale')(data?.config).timezone

  const NOW = Date.now()

  const periodDomains = {
    Day: [NOW - DAY, NOW],
    Week: [NOW - WEEK, NOW],
    Month: [NOW - MONTH, NOW]
  }

  const isInRangeAndNoError = getLastTimePeriod => t => {
    if (t.error !== null) return false
    if (t.txClass === 'cashOut' && !t.dispense) return false
    if (t.txClass === 'cashIn' && !t.sendConfirmed) return false
    if (!getLastTimePeriod) {
      return (
        t.error === null &&
        isAfter(
          toTimezone(t.created, timezone),
          toTimezone(periodDomains[selectedRange][1], timezone)
        ) &&
        isAfter(
          toTimezone(periodDomains[selectedRange][0], timezone),
          toTimezone(t.created, timezone)
        )
      )
    }
    return (
      t.error === null &&
      isAfter(
        toTimezone(periodDomains[selectedRange][1], timezone),
        toTimezone(t.created, timezone)
      ) &&
      isAfter(
        toTimezone(t.created, timezone),
        toTimezone(periodDomains[selectedRange][0], timezone)
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
    new BigNumber(R.sum(getFiats(transactionsToShow))).toFormat(2)

  const getProfit = transactions => {
    return R.reduce(
      (acc, value) => acc.plus(value.profit),
      new BigNumber(0),
      transactions
    )
  }

  const getPercentChange = () => {
    const thisTimePeriodProfit = getProfit(transactionsToShow)
    const previousTimePeriodProfit = getProfit(transactionsLastTimePeriod)

    if (thisTimePeriodProfit.eq(previousTimePeriodProfit)) return 0
    if (previousTimePeriodProfit.eq(0)) return 100

    return thisTimePeriodProfit
      .minus(previousTimePeriodProfit)
      .times(100)
      .div(previousTimePeriodProfit)
      .toNumber()
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

  const percentageClasses = {
    [classes.percentDown]: percentChange < 0,
    [classes.percentUp]: percentChange > 0,
    [classes.percentNeutral]: percentChange === 0
  }

  const getPercentageIcon = () => {
    if (percentChange === 0)
      return <PercentNeutralIcon className={classes.directionIcon} />
    if (percentChange > 0)
      return <PercentUpIcon className={classes.directionIcon} />
    return <PercentDownIcon className={classes.directionIcon} />
  }

  return (
    <>
      <Nav
        showPicker={!loading && !R.isEmpty(data.transactions)}
        handleSetRange={setSelectedRange}
      />
      {!loading && R.isEmpty(data.transactions) && (
        <EmptyTable
          className={classes.emptyTransactions}
          message="No transactions so far"
        />
      )}
      {!loading && !R.isEmpty(data.transactions) && (
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
          <Grid container className={classes.txGraphContainer}>
            <Grid item xs={12}>
              <div className={classes.graphHeader}>
                <Label2 noMargin>Transactions</Label2>
                <div className={classes.labelWrapper}>
                  <P noMargin>
                    {timezones[timezone]?.short ?? timezones[timezone]?.long}{' '}
                    timezone
                  </P>
                  <span className={classes.verticalLine} />
                  <div>
                    <svg width={8} height={8}>
                      <rect width={8} height={8} rx={4} fill={java} />
                    </svg>
                    <Label1 noMargin>In</Label1>
                  </div>
                  <div>
                    <svg width={8} height={8}>
                      <rect width={8} height={8} rx={4} fill={neon} />
                    </svg>
                    <Label1 noMargin>Out</Label1>
                  </div>
                </div>
              </div>
              <Scatterplot
                timeFrame={selectedRange}
                data={transactionsToShow}
                timezone={timezone}
              />
            </Grid>
          </Grid>
          <Grid container className={classes.commissionGraphContainer}>
            <Grid item xs={8}>
              <Label2 noMargin className={classes.commissionProfitTitle}>
                Profit from commissions
              </Label2>
              <div className={classes.profitContainer}>
                <div className={classes.profitLabel}>
                  {`${getProfit(transactionsToShow).toFormat(2)} ${
                    data?.config.locale_fiatCurrency
                  }`}
                </div>
                <div className={classnames(percentageClasses)}>
                  {getPercentageIcon()}
                  {`${new BigNumber(percentChange).toFormat(2)}%`}
                </div>
              </div>
              <LineChart
                timeFrame={selectedRange}
                data={transactionsToShow}
                previousTimeData={transactionsLastTimePeriod}
                previousProfit={getProfit(transactionsLastTimePeriod)}
              />
            </Grid>
            <Grid item xs={4}>
              <Grid container className={classes.graphHeader}>
                <Label2 noMargin>Direction</Label2>
                <div className={classes.labelWrapper}>
                  <div>
                    <svg width={8} height={8}>
                      <rect width={8} height={8} rx={2} fill={java} />
                    </svg>
                    <Label1 noMargin>In</Label1>
                  </div>
                  <div>
                    <svg width={8} height={8}>
                      <rect width={8} height={8} rx={2} fill={neon} />
                    </svg>
                    <Label1 noMargin>Out</Label1>
                  </div>
                </div>
              </Grid>
              <Grid item xs>
                <PercentageChart
                  cashIn={getDirectionPercent().cashIn}
                  cashOut={getDirectionPercent().cashOut}
                />
              </Grid>
            </Grid>
          </Grid>
        </>
      )}
    </>
  )
}

export default SystemPerformance
