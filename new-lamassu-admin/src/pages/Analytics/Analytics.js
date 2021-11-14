import { useQuery } from '@apollo/react-hooks'
import { Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Select } from 'src/components/inputs'
import TitleSection from 'src/components/layout/TitleSection'
import { Info2, P } from 'src/components/typography'
import { ReactComponent as DownIcon } from 'src/styling/icons/dashboard/down.svg'
import { ReactComponent as EqualIcon } from 'src/styling/icons/dashboard/equal.svg'
import { ReactComponent as UpIcon } from 'src/styling/icons/dashboard/up.svg'
import { fromNamespace } from 'src/utils/config'
import { DAY, WEEK, MONTH } from 'src/utils/time'

import styles from './Analytics.styles'
import LegendEntry from './components/LegendEntry'
import HourOfDayWrapper from './components/wrappers/HourOfDayWrapper'
import OverTimeWrapper from './components/wrappers/OverTimeWrapper'
import TopMachinesWrapper from './components/wrappers/TopMachinesWrapper'

const useStyles = makeStyles(styles)

const MACHINE_OPTIONS = [{ code: 'all', display: 'All machines' }]
const REPRESENTING_OPTIONS = [
  { code: 'overTime', display: 'Over time' },
  { code: 'topMachines', display: 'Top Machines' },
  { code: 'hourOfTheDay', display: 'Hour of the day' }
]
const PERIOD_OPTIONS = [
  { code: 'day', display: 'Last 24 hours' },
  { code: 'week', display: 'Last 7 days' },
  { code: 'month', display: 'Last 30 days' }
]
const TIME_OPTIONS = {
  day: DAY,
  week: WEEK,
  month: MONTH
}

const GET_TRANSACTIONS = gql`
  query transactions($limit: Int, $from: Date, $until: Date) {
    transactions(limit: $limit, from: $from, until: $until) {
      id
      txClass
      txHash
      toAddress
      commissionPercentage
      expired
      machineName
      operatorCompleted
      sendConfirmed
      dispense
      hasError: error
      deviceId
      fiat
      cashInFee
      fiatCode
      cryptoAtoms
      cryptoCode
      toAddress
      created
    }
  }
`

const GET_DATA = gql`
  query getData {
    config
    machines {
      name
      deviceId
    }
    fiatRates {
      code
      name
      rate
    }
  }
`

const OverviewEntry = ({ label, value, oldValue, currency }) => {
  const classes = useStyles()

  const _oldValue = !oldValue || R.equals(oldValue, 0) ? 1 : oldValue
  const growthRate = ((value - oldValue) * 100) / _oldValue

  const growthClasses = {
    [classes.growthPercentage]: true,
    [classes.growth]: R.gt(value, oldValue),
    [classes.decline]: R.gt(oldValue, value)
  }

  return (
    <div className={classes.overviewEntry}>
      <P noMargin>{label}</P>
      <Info2 noMargin className={classes.overviewFieldWrapper}>
        <span>
          {value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </span>
        {!!currency && ` ${currency}`}
      </Info2>
      <span className={classes.overviewGrowth}>
        {R.gt(growthRate, 0) && <UpIcon height={10} />}
        {R.lt(growthRate, 0) && <DownIcon height={10} />}
        {R.equals(growthRate, 0) && <EqualIcon height={10} />}
        <P noMargin className={classnames(growthClasses)}>
          {growthRate.toLocaleString('en-US', { maximumFractionDigits: 2 })}%
        </P>
      </span>
    </div>
  )
}

const Analytics = () => {
  const classes = useStyles()

  const { data: txResponse, loading: txLoading } = useQuery(GET_TRANSACTIONS)
  const { data: configResponse, loading: configLoading } = useQuery(GET_DATA)

  const [representing, setRepresenting] = useState(REPRESENTING_OPTIONS[0])
  const [period, setPeriod] = useState(PERIOD_OPTIONS[0])
  const [machine, setMachine] = useState(MACHINE_OPTIONS[0])

  const loading = txLoading || configLoading

  const transactions = R.path(['transactions'])(txResponse) ?? []
  const machines = R.path(['machines'])(configResponse) ?? []
  const config = R.path(['config'])(configResponse) ?? []
  const rates = R.path(['fiatRates'])(configResponse) ?? []
  const fiatLocale = fromNamespace('locale')(config).fiatCurrency

  const timezone = config?.locale_timezone

  const convertFiatToLocale = item => {
    if (item.fiatCode === fiatLocale) return item
    const itemRate = R.find(R.propEq('code', item.fiatCode))(rates)
    const localeRate = R.find(R.propEq('code', fiatLocale))(rates)
    const multiplier = localeRate?.rate / itemRate?.rate
    return { ...item, fiat: parseFloat(item.fiat) * multiplier }
  }

  const data =
    R.map(convertFiatToLocale)(
      transactions?.filter(
        tx =>
          (!tx.dispensed || !tx.expired) && (tx.sendConfirmed || tx.dispense)
      )
    ) ?? []

  const machineOptions = R.clone(MACHINE_OPTIONS)

  R.forEach(
    m => machineOptions.push({ code: m.deviceId, display: m.name }),
    machines
  )

  const machineTxs = R.filter(
    tx => (machine.code === 'all' ? true : tx.deviceId === machine.code),
    data
  )

  const filteredData = timeInterval => ({
    current:
      machineTxs.filter(
        d => new Date(d.created) >= Date.now() - TIME_OPTIONS[timeInterval]
      ) ?? [],
    previous:
      machineTxs.filter(
        d =>
          new Date(d.created) < Date.now() - TIME_OPTIONS[timeInterval] &&
          new Date(d.created) >= Date.now() - 2 * TIME_OPTIONS[timeInterval]
      ) ?? []
  })

  const txs = {
    current: filteredData(period.code).current.length,
    previous: filteredData(period.code).previous.length
  }

  const avgAmount = {
    current:
      R.sum(R.map(d => d.fiat, filteredData(period.code).current)) /
      (txs.current === 0 ? 1 : txs.current),
    previous:
      R.sum(R.map(d => d.fiat, filteredData(period.code).previous)) /
      (txs.previous === 0 ? 1 : txs.previous)
  }

  const txVolume = {
    current: R.sum(R.map(d => d.fiat, filteredData(period.code).current)),
    previous: R.sum(R.map(d => d.fiat, filteredData(period.code).previous))
  }

  const commissions = {
    current: R.sum(
      R.map(
        d => d.fiat * d.commissionPercentage,
        filteredData(period.code).current
      )
    ),
    previous: R.sum(
      R.map(
        d => d.fiat * d.commissionPercentage,
        filteredData(period.code).previous
      )
    )
  }

  const getGraphInfo = representing => {
    switch (representing.code) {
      case 'overTime':
        return (
          <OverTimeWrapper
            title="Transactions over time"
            representing={representing}
            period={period}
            data={R.map(convertFiatToLocale)(filteredData(period.code).current)}
            machines={machineOptions}
            selectedMachine={machine}
            handleMachineChange={setMachine}
            timezone={timezone}
            currency={fiatLocale}
          />
        )
      case 'topMachines':
        return (
          <TopMachinesWrapper
            title="Transactions over time"
            representing={representing}
            period={period}
            data={R.map(convertFiatToLocale)(filteredData(period.code).current)}
            machines={machineOptions}
            selectedMachine={machine}
            handleMachineChange={setMachine}
            timezone={timezone}
            currency={fiatLocale}
          />
        )
      case 'hourOfTheDay':
        return (
          <HourOfDayWrapper
            title="Avg. transactions per hour of the day"
            representing={representing}
            period={period}
            data={R.map(convertFiatToLocale)(filteredData(period.code).current)}
            machines={machineOptions}
            selectedMachine={machine}
            handleMachineChange={setMachine}
            timezone={timezone}
            currency={fiatLocale}
          />
        )
      default:
        throw new Error(`There's no graph info to represent ${representing}`)
    }
  }

  return (
    !loading && (
      <>
        <TitleSection title="Analytics">
          <Box className={classes.overviewLegend}>
            <LegendEntry
              IconComponent={UpIcon}
              label={'Up since last period'}
            />
            <LegendEntry
              IconComponent={DownIcon}
              label={'Down since last period'}
            />
            <LegendEntry
              IconComponent={EqualIcon}
              label={'Same since last period'}
            />
          </Box>
        </TitleSection>
        <div className={classes.dropdownsOverviewWrapper}>
          <div className={classes.dropdowns}>
            <Select
              label="Representing"
              onSelectedItemChange={setRepresenting}
              items={REPRESENTING_OPTIONS}
              default={REPRESENTING_OPTIONS[0]}
              selectedItem={representing}
            />
            <Select
              label="Time period"
              onSelectedItemChange={setPeriod}
              items={PERIOD_OPTIONS}
              default={PERIOD_OPTIONS[0]}
              selectedItem={period}
            />
          </div>
          <div className={classes.overview}>
            <OverviewEntry
              label="Transactions"
              value={txs.current}
              oldValue={txs.previous}
            />
            <div className={classes.verticalLine} />
            <OverviewEntry
              label="Avg. txn amount"
              value={avgAmount.current}
              oldValue={avgAmount.previous}
              currency={fiatLocale}
            />
            <div className={classes.verticalLine} />
            <OverviewEntry
              label="Volume"
              value={txVolume.current}
              oldValue={txVolume.previous}
              currency={fiatLocale}
            />
            <div className={classes.verticalLine} />
            <OverviewEntry
              label="Commissions"
              value={commissions.current}
              oldValue={commissions.previous}
              currency={fiatLocale}
            />
          </div>
        </div>
        {getGraphInfo(representing)}
      </>
    )
  )
}

export default Analytics
