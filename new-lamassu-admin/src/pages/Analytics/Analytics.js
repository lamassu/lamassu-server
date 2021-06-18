import { useQuery } from '@apollo/react-hooks'
import { Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Select } from 'src/components/inputs'
import TitleSection from 'src/components/layout/TitleSection'
import { H2, Info2, P } from 'src/components/typography'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'

import styles from './Analytics.styles'
import Graph from './Graph'

const useStyles = makeStyles(styles)

const DAY = 24 * 60 * 60 * 1000
const WEEK = 7 * 24 * 60 * 60 * 1000
const MONTH = 30 * 24 * 60 * 60 * 1000

const MACHINE_OPTIONS = [{ code: 'all', display: 'All machines' }]
const REPRESENTING_OPTIONS = [{ code: 'overTime', display: 'Over time' }]
const PERIOD_OPTIONS = [
  { code: 'day', display: 'Last 24 hours' },
  { code: 'week', display: 'Last 7 days' },
  { code: 'month', display: 'Last 30 days' }
]

const GET_TRANSACTIONS = gql`
  query transactions($limit: Int, $from: DateTime, $until: DateTime) {
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
      customerName
      customerIdCardData
      customerIdCardPhotoPath
      customerFrontCameraPath
      customerPhone
      discount
      customerId
      isAnonymous
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
  }
`

const LegendEntry = ({ IconComponent, label }) => {
  const classes = useStyles()

  return (
    <span className={classes.legendEntry}>
      <IconComponent height={10} />
      <P>{label}</P>
    </span>
  )
}

const OverviewEntry = ({
  label,
  value,
  oldValue,
  currencies,
  mainCurrency
}) => {
  const classes = useStyles()

  const isCurrency = !!currencies
  // const mostUsedCurrency = R.reduce(
  //   (acc, v) => (acc === '' ? v : currencies[v] > currencies[acc] ? v : acc),
  //   '',
  //   R.keys(currencies)
  // )

  const _oldValue = !oldValue || R.equals(oldValue, 0) ? 1 : oldValue
  const growthRate = ((value - oldValue) * 100) / _oldValue

  const growthClasses = {
    [classes.growth]: R.gt(value, oldValue),
    [classes.decline]: R.gt(oldValue, value)
  }

  return (
    <div className={classes.overviewEntry}>
      <P noMargin>{label}</P>
      <Info2 noMargin className={classes.overviewFieldWrapper}>
        <span>
          {isCurrency
            ? value.toLocaleString('en-US', { maximumFractionDigits: 2 })
            : value}
        </span>
        {isCurrency &&
          ` ${mainCurrency} ${R.length(currencies) > 1 ? '*' : ''}`}
      </Info2>
      <span className={classes.overviewGrowth}>
        <CloseIcon height={10} />
        <P noMargin className={classnames(growthClasses)}>
          {growthRate.toLocaleString('en-US', { maximumFractionDigits: 2 })}%
        </P>
      </span>
    </div>
  )
}

const AnalyticsGraph = ({
  title,
  representing,
  period,
  data,
  machines,
  selectedMachine,
  handleMachineChange,
  timezone
}) => {
  const classes = useStyles()

  return (
    <>
      <div className={classes.graphHeaderWrapper}>
        <div className={classes.graphHeaderLeft}>
          <H2 noMargin>{title}</H2>
          <Box className={classes.graphLegend}>
            <LegendEntry IconComponent={CloseIcon} label={'Cash-in'} />
            <LegendEntry IconComponent={CloseIcon} label={'Cash-out'} />
            <LegendEntry IconComponent={CloseIcon} label={'One transaction'} />
            <LegendEntry IconComponent={CloseIcon} label={'Average'} />
          </Box>
        </div>
        <div className={classes.graphHeaderRight}>
          <Select
            label="Machines"
            onSelectedItemChange={handleMachineChange}
            items={machines}
            default={machines[0]}
            selectedItem={selectedMachine}
          />
        </div>
      </div>
      <Graph
        representing={representing}
        period={period}
        data={data}
        timezone={timezone}
      />
    </>
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

  const timezone = config?.locale_timezone
  const formattedTimezone = `${timezone?.utcOffset}:${timezone?.dstOffset}`

  const primaryFiat = config?.locale_fiatCurrency

  const data =
    transactions?.filter(
      tx => !tx.expired && (tx.sendConfirmed || tx.dispense)
    ) ?? []

  const usedCurrencies = R.reduce(
    (acc, v) => {
      acc[v.fiatCode] ? (acc[v.fiatCode] += 1) : (acc[v.fiatCode] = 1)
      return acc
    },
    {},
    data
  )

  const machineOptions = R.clone(MACHINE_OPTIONS)

  R.forEach(
    m => machineOptions.push({ code: m.deviceId, display: m.name }),
    machines
  )

  const machineTxs = R.filter(
    tx => (machine.code === 'all' ? true : tx.deviceId === machine.code),
    data
  )

  const filteredData = {
    day: {
      current:
        machineTxs.filter(d => new Date(d.created) >= Date.now() - DAY) ?? [],
      previous:
        machineTxs.filter(
          d =>
            new Date(d.created) < Date.now() - DAY &&
            new Date(d.created) >= Date.now() - 2 * DAY
        ) ?? []
    },
    week: {
      current:
        machineTxs.filter(
          d => new Date(d.created).getTime() >= Date.now() - WEEK
        ) ?? [],
      previous:
        machineTxs.filter(
          d =>
            new Date(d.created).getTime() < Date.now() - WEEK &&
            new Date(d.created).getTime() >= Date.now() - 2 * WEEK
        ) ?? []
    },
    month: {
      current:
        machineTxs.filter(
          d => new Date(d.created).getTime() >= Date.now() - MONTH
        ) ?? [],
      previous:
        machineTxs.filter(
          d =>
            new Date(d.created).getTime() < Date.now() - MONTH &&
            new Date(d.created).getTime() >= Date.now() - 2 * MONTH
        ) ?? []
    }
  }

  const txs = {
    current: filteredData[period.code].current.length,
    previous: filteredData[period.code].previous.length
  }

  const avgAmount = {
    current:
      R.sum(R.map(d => d.fiat, filteredData[period.code].current)) /
      (txs.current === 0 ? 1 : txs.current),
    previous:
      R.sum(R.map(d => d.fiat, filteredData[period.code].previous)) /
      (txs.previous === 0 ? 1 : txs.previous)
  }

  const txVolume = {
    current: R.sum(R.map(d => d.fiat, filteredData[period.code].current)),
    previous: R.sum(R.map(d => d.fiat, filteredData[period.code].previous))
  }

  const commissions = {
    current: R.sum(
      R.map(
        d => d.fiat * d.commissionPercentage,
        filteredData[period.code].current
      )
    ),
    previous: R.sum(
      R.map(
        d => d.fiat * d.commissionPercentage,
        filteredData[period.code].previous
      )
    )
  }

  return (
    !loading && (
      <>
        <TitleSection title="Analytics">
          <Box className={classes.overviewLegend}>
            <LegendEntry
              IconComponent={CloseIcon}
              label={'Up since last period'}
            />
            <LegendEntry
              IconComponent={CloseIcon}
              label={'Down since last period'}
            />
            <LegendEntry
              IconComponent={CloseIcon}
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
              currencies={usedCurrencies}
              mainCurrency={primaryFiat}
            />
            <div className={classes.verticalLine} />
            <OverviewEntry
              label="Volume"
              value={txVolume.current}
              oldValue={txVolume.previous}
              currencies={usedCurrencies}
              mainCurrency={primaryFiat}
            />
            <div className={classes.verticalLine} />
            <OverviewEntry
              label="Commissions"
              value={commissions.current}
              oldValue={commissions.previous}
              currencies={usedCurrencies}
              mainCurrency={primaryFiat}
            />
          </div>
        </div>
        <AnalyticsGraph
          title="Transactions over time"
          representing={representing}
          period={period}
          data={filteredData[period.code].current}
          machines={machineOptions}
          selectedMachine={machine}
          handleMachineChange={m => setMachine(m)}
          timezone={formattedTimezone}
        />
      </>
    )
  )
}

export default Analytics
