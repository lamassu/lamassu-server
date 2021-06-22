import { makeStyles } from '@material-ui/core'
import * as R from 'ramda'
import React, { memo, useState } from 'react'

import { Table as EditableTable } from 'src/components/editableTable'
import { Select } from 'src/components/inputs'
import {
  overridesDefaults,
  getCommissions,
  getListCommissionsSchema,
  commissionsList
} from 'src/pages/Commissions/helper'

const styles = {
  headerLine: {
    display: 'flex',
    justifyContent: '',
    marginBottom: 24
  },
  select: {
    marginRight: 24
  },
  tableWrapper: {
    flex: 1,
    display: 'block',
    overflowY: 'auto',
    width: '100%',
    maxHeight: '70vh'
  }
}

const SHOW_ALL = {
  code: 'SHOW_ALL',
  display: 'Show all'
}

const ORDER_OPTIONS = [
  {
    code: 'machine',
    display: 'Machine Name'
  },
  {
    code: 'cryptoCurrencies',
    display: 'Cryptocurrency'
  },
  {
    code: 'cashIn',
    display: 'Cash-in'
  },
  {
    code: 'cashOut',
    display: 'Cash-out'
  },
  {
    code: 'fixedFee',
    display: 'Fixed Fee'
  },
  {
    code: 'minimumTx',
    display: 'Minimum Tx'
  }
]

const useStyles = makeStyles(styles)

const getElement = (code, display) => ({
  code: code,
  display: display || code
})

const sortCommissionsBy = prop => {
  switch (prop) {
    case ORDER_OPTIONS[0]:
      return R.sortBy(R.find(R.propEq('code', R.prop('machine'))))
    case ORDER_OPTIONS[1]:
      return R.sortBy(R.path(['cryptoCurrencies', 0]))
    default:
      return R.sortBy(R.prop(prop.code))
  }
}

const filterCommissions = (coinFilter, machineFilter) =>
  R.compose(
    R.filter(
      it => (machineFilter === SHOW_ALL) | (machineFilter.code === it.machine)
    ),
    R.filter(
      it =>
        (coinFilter === SHOW_ALL) | (coinFilter.code === it.cryptoCurrencies[0])
    )
  )

const CommissionsList = memo(
  ({ config, localeConfig, currency, data, error, saveOverrides }) => {
    const classes = useStyles()

    const [machineFilter, setMachineFilter] = useState(SHOW_ALL)
    const [coinFilter, setCoinFilter] = useState(SHOW_ALL)
    const [orderProp, setOrderProp] = useState(ORDER_OPTIONS[0])

    const coins = R.prop('cryptoCurrencies', localeConfig)

    const getMachineCoins = deviceId => {
      const override = R.prop('overrides', localeConfig)?.find(
        R.propEq('machine', deviceId)
      )

      const machineCoins = override
        ? R.prop('cryptoCurrencies', override)
        : coins

      return R.xprod([deviceId], machineCoins)
    }

    const getMachineElement = it =>
      getElement(R.prop('deviceId', it), R.prop('name', it))

    const cryptoData = R.map(getElement)(coins)

    const machineData = R.sortBy(
      R.prop('display'),
      R.map(getMachineElement)(R.prop('machines', data))
    )

    const machinesCoinsTuples = R.unnest(
      R.map(getMachineCoins)(machineData.map(R.prop('code')))
    )

    const commissions = R.map(([deviceId, cryptoCode]) =>
      getCommissions(cryptoCode, deviceId, config)
    )(machinesCoinsTuples)

    const tableData = R.compose(
      sortCommissionsBy(orderProp),
      filterCommissions(coinFilter, machineFilter)
    )(commissions)

    return (
      <div>
        <div className={classes.headerLine}>
          <Select
            className={classes.select}
            onSelectedItemChange={setMachineFilter}
            label="Machines"
            default={SHOW_ALL}
            items={[SHOW_ALL].concat(machineData)}
            selectedItem={machineFilter}
          />
          <Select
            className={classes.select}
            onSelectedItemChange={setCoinFilter}
            label="Cryptocurrency"
            default={SHOW_ALL}
            items={[SHOW_ALL].concat(cryptoData)}
            selectedItem={coinFilter}
          />
          <Select
            onSelectedItemChange={setOrderProp}
            label="Sort by"
            default={ORDER_OPTIONS[0]}
            items={ORDER_OPTIONS}
            selectedItem={orderProp}
          />
        </div>
        <div className={classes.tableWrapper}>
          <EditableTable
            error={error?.message}
            name="comissionsList"
            enableEdit
            save={saveOverrides}
            initialValues={overridesDefaults}
            validationSchema={getListCommissionsSchema(localeConfig)}
            data={tableData}
            elements={commissionsList(data, currency)}
          />
        </div>
      </div>
    )
  }
)

export default CommissionsList
