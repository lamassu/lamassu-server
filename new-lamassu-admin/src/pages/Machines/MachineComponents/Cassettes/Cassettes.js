import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import DataTable from 'src/components/tables/DataTable'
import CashUnitDetails from 'src/pages/Maintenance/CashUnitDetails'
import Wizard from 'src/pages/Maintenance/Wizard/Wizard'
import helper from 'src/pages/Maintenance/helper'
import { fromNamespace } from 'src/utils/config'

import styles from './Cassettes.styles'

const useStyles = makeStyles(styles)

const SET_CASSETTE_BILLS = gql`
  mutation MachineAction(
    $deviceId: ID!
    $action: MachineAction!
    $cashUnits: CashUnitsInput
  ) {
    machineAction(deviceId: $deviceId, action: $action, cashUnits: $cashUnits) {
      deviceId
      cashUnits {
        cashbox
        cassette1
        cassette2
        cassette3
        cassette4
        recycler1
        recycler2
        recycler3
        recycler4
        recycler5
        recycler6
      }
    }
  }
`

const widths = {
  name: 0,
  cashbox: 175,
  cassettes: 585,
  edit: 90
}

const CashCassettes = ({ machine, config, refetchData, bills }) => {
  const classes = useStyles()

  const [wizard, setWizard] = useState(false)

  const cashout = config && fromNamespace('cashOut')(config)
  const locale = config && fromNamespace('locale')(config)
  const fiatCurrency = locale?.fiatCurrency

  const getCashoutSettings = deviceId => fromNamespace(deviceId)(cashout)

  const elements = R.filter(it => it.name !== 'name')(
    helper.getElements(classes, config, bills, setWizard, widths)
  )

  const [setCassetteBills, { error }] = useMutation(SET_CASSETTE_BILLS, {
    refetchQueries: () => refetchData()
  })

  const onSave = (_, cashUnits) =>
    setCassetteBills({
      variables: {
        action: 'setCassetteBills',
        deviceId: machine.deviceId,
        cashUnits
      }
    })

  const InnerCashUnitDetails = ({ it }) => (
    <CashUnitDetails
      machine={it}
      bills={bills[it.deviceId] ?? []}
      currency={fiatCurrency}
      config={config}
      hideMachineData
      widths
    />
  )

  return machine.name ? (
    <>
      <DataTable
        elements={elements}
        data={[machine]}
        Details={InnerCashUnitDetails}
        emptyText="No machines so far"
        initialExpanded={0}
        tableClassName={classes.dataTable}
      />
      {wizard && (
        <Wizard
          machine={machine}
          cashoutSettings={getCashoutSettings(machine.deviceId)}
          onClose={() => {
            setWizard(false)
          }}
          error={error?.message}
          save={onSave}
          locale={locale}
        />
      )}
    </>
  ) : null
}

export default CashCassettes
