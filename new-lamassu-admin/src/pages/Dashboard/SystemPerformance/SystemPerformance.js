import Grid from '@material-ui/core/Grid'
import moment from 'moment'
import * as R from 'ramda'
import React, { useState, useEffect } from 'react'

import { Label1, Label2 } from 'src/components/typography/index'

import InfoWithLabel from './InfoWithLabel'
import Nav from './Nav'

const isNotProp = R.curry(R.compose(R.isNil, R.prop))
const getFiats = R.map(R.prop('fiat'))
const getProps = propName => R.map(R.prop(propName))

const getDateDaysAgo = (days = 0) => {
  return moment().subtract('day', days)
}
const now = moment()

const data = {
  transactions: [
    {
      fiatCode: 'USD',
      fiat: '140.00000',
      cashInFee: '1.00000',
      commissionPercentage: '0.01000',
      created: '2020-10-29T21:17:05.664Z',
      txClass: 'cashIn',
      error: 'Insufficient Funds Error'
    },
    {
      fiatCode: 'USD',
      fiat: '110.00000',
      cashInFee: '1.00000',
      commissionPercentage: '0.01000',
      created: '2020-10-28T21:15:55.864Z',
      txClass: 'cashOut',
      error: null
    },
    {
      fiatCode: 'USD',
      fiat: '150.00000',
      cashInFee: '1.00000',
      commissionPercentage: '0.01000',
      created: '2020-10-29T21:15:33.970Z',
      txClass: 'cashIn',
      error: 'Insufficient Funds Error'
    },
    {
      fiatCode: 'USD',
      fiat: '200.00000',
      cashInFee: '1.00000',
      commissionPercentage: '0.01000',
      created: '2020-10-29T21:15:16.910Z',
      txClass: 'cashIn',
      error: 'Insufficient Funds Error'
    },
    {
      fiatCode: 'USD',
      fiat: '100.00000',
      cashInFee: '1.00000',
      commissionPercentage: '0.01000',
      created: '2020-10-29T21:15:00.565Z',
      txClass: 'cashIn',
      error: null
    },
    {
      fiatCode: 'USD',
      fiat: '12.00000',
      cashInFee: '1.00000',
      commissionPercentage: '0.01000',
      created: '2020-10-29T21:14:40.358Z',
      txClass: 'cashIn',
      error: null
    },
    {
      fiatCode: 'USD',
      fiat: '10.00000',
      cashInFee: '1.00000',
      commissionPercentage: '0.01000',
      created: '2020-10-29T21:14:08.669Z',
      txClass: 'cashIn',
      error: null
    },
    {
      fiatCode: 'USD',
      fiat: '400.00000',
      cashInFee: '1.00000',
      commissionPercentage: '0.01000',
      created: '2020-10-29T21:11:55.241Z',
      txClass: 'cashIn',
      error: 'Insufficient Funds Error'
    },
    {
      fiatCode: 'USD',
      fiat: '500.00000',
      cashInFee: '1.00000',
      commissionPercentage: '0.01000',
      created: '2020-10-29T21:10:50.386Z',
      txClass: 'cashIn',
      error: 'Insufficient Funds Error'
    },
    {
      fiatCode: 'USD',
      fiat: '10.00000',
      cashInFee: '1.00000',
      commissionPercentage: '0.01000',
      created: '2020-08-29T21:08:12.690Z',
      txClass: 'cashIn',
      error: null
    },
    {
      fiatCode: 'USD',
      fiat: '250.00000',
      cashInFee: '1.00000',
      commissionPercentage: '0.01000',
      created: '2020-10-20T21:07:47.075Z',
      txClass: 'cashIn',
      error: null
    },
    {
      fiatCode: 'USD',
      fiat: '100.00000',
      cashInFee: '1.00000',
      commissionPercentage: '0.01000',
      created: '2020-11-03T09:03:55.581Z',
      txClass: 'cashIn',
      error: null
    },
    {
      fiatCode: 'EUR',
      fiat: '999.00000',
      cashInFee: '1.00000',
      commissionPercentage: '0.11000',
      created: '2019-10-19T16:31:28.076Z',
      txClass: 'cashIn',
      error: null
    }
  ],
  config: {
    locale_fiatCurrency: 'USD'
  }
}

const SystemPerformance = () => {
  const [selectedRange, setSelectedRange] = useState('24 hours')
  const [transactionsToShow, setTransactionsToShow] = useState([])
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
    setTransactionsToShow(R.filter(isInRange, data.transactions))
  }, [selectedRange])

  const handleSetRange = range => {
    setSelectedRange(range)
  }

  const getNumTransactions = () => {
    return R.length(R.filter(isNotProp('error'), transactionsToShow))
  }

  const getFiatVolume = () => {
    return R.sum(getFiats(R.filter(isNotProp('error'), transactionsToShow)))
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
    return commissionFees + cashInFees
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
      cashIn: Math.round((directions.cashIn / directions.length) * 100),
      cashOut: Math.round((directions.cashOut / directions.length) * 100)
    }
  }

  return (
    <>
      <Nav handleSetRange={handleSetRange} />
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <InfoWithLabel info={getNumTransactions()} label={'transactions'} />
        </Grid>
        <Grid item xs={3}>
          <InfoWithLabel
            info={getFiatVolume()}
            label={`${data.config.locale_fiatCurrency} volume`}
          />
        </Grid>
        {/* todo new customers */}
      </Grid>
      <Grid container style={{ marginTop: 30 }}>
        <Grid item xs={12}>
          <Label2>Transactions</Label2>
          <p>graph goes here</p>
        </Grid>
      </Grid>
      <Grid container style={{ marginTop: 30 }}>
        <Grid item xs={8}>
          <Label2>Profit from commissions</Label2>
          {`${getProfit()} ${data.config.locale_fiatCurrency}`}
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
  )
}

export default SystemPerformance
