import { makeStyles } from '@material-ui/core'
import * as R from 'ramda'
import React, { memo, useState } from 'react'

import { Table as EditableTable } from 'src/components/editableTable'
import { Select } from 'src/components/inputs'
import {
  overridesDefaults,
  getCommissions,
  getMachineCoins,
  getListCommissionsSchema,
  commissionsList,
  sortCommissionsBy,
  filterCommissions,
  SHOW_ALL,
  ORDER_OPTIONS
} from 'src/pages/Commissions/helper'

const styles = {
  headerLine: {
    display: 'flex',
    justifyContent: '',
    marginBottom: 24,
    '& div': {
      marginRight: 24
    }
  },
  tableWrapper: {
    flex: 1,
    display: 'block',
    overflowX: 'auto',
    width: '100%',
    maxHeight: '70vh'
  }
}

const useStyles = makeStyles(styles)

const CommissionsList = memo(
  ({ config, localeConfig, currency, data, error, saveOverrides }) => {
    const classes = useStyles()

    const [machineFilter, setMachineFilter] = useState(SHOW_ALL)
    const [coinFilter, setCoinFilter] = useState(SHOW_ALL)
    const [orderProp, setOrderProp] = useState('Machine name')

    const cryptoCurrencies = R.prop('cryptoCurrencies', localeConfig)

    const machines = R.prop('machines', data)
    const machinesIds = R.map(R.prop('deviceId'))(machines)
    const machinesNames = R.map(R.prop('name'))(machines)

    const machinesCoins = R.map(m =>
      R.xprod([m], getMachineCoins(m, localeConfig))
    )(machinesIds)

    const machinesCoinsTuples = R.unnest(machinesCoins)

    const commissions = R.map(([deviceId, cryptoCode]) =>
      getCommissions(cryptoCode, deviceId, config)
    )(machinesCoinsTuples)

    return (
      <div>
        <div className={classes.headerLine}>
          <Select
            onSelectedItemChange={setMachineFilter}
            label="Machines"
            default={SHOW_ALL}
            items={[SHOW_ALL].concat(R.sortBy(R.identity, machinesNames))}
            selectedItem={machineFilter}
          />
          <Select
            onSelectedItemChange={setCoinFilter}
            label="Cryptocurrency"
            default={SHOW_ALL}
            items={[SHOW_ALL].concat(cryptoCurrencies)}
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
            initialValues={overridesDefaults}
            validationSchema={getListCommissionsSchema()}
            data={R.compose(
              sortCommissionsBy(orderProp, machines),
              filterCommissions(coinFilter, machineFilter, machines)
            )(commissions)}
            elements={commissionsList(data, currency)}
          />
        </div>
      </div>
    )
  }
)

export default CommissionsList
