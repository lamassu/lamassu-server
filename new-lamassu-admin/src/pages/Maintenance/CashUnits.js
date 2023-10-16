import { useQuery, useMutation } from '@apollo/react-hooks'
import { DialogActions, makeStyles, Box } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import LogsDowloaderPopover from 'src/components/LogsDownloaderPopper'
import Modal from 'src/components/Modal'
import { IconButton, Button } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs'
import TitleSection from 'src/components/layout/TitleSection'
import { EmptyTable } from 'src/components/table'
import DataTable from 'src/components/tables/DataTable'
import { P, Label1 } from 'src/components/typography'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as ReverseHistoryIcon } from 'src/styling/icons/circle buttons/history/white.svg'
import { ReactComponent as HistoryIcon } from 'src/styling/icons/circle buttons/history/zodiac.svg'
import { fromNamespace, toNamespace } from 'src/utils/config'
import { MANUAL, AUTOMATIC } from 'src/utils/constants'
import { onlyFirstToUpper } from 'src/utils/string'

import CashUnitDetails from './CashUnitDetails'
import styles from './CashUnits.styles'
import CashCassettesFooter from './CashUnitsFooter'
import CashboxHistory from './CashboxHistory'
import Wizard from './Wizard/Wizard'
import helper from './helper'

const useStyles = makeStyles(styles)

const GET_MACHINES_AND_CONFIG = gql`
  query getData($billFilters: JSONObject) {
    machines {
      name
      id: deviceId
      model
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
      numberOfCassettes
      numberOfRecyclers
    }
    unpairedMachines {
      id: deviceId
      name
    }
    config
    bills(filters: $billFilters) {
      id
      fiat
      created
      deviceId
    }
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

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

const GET_BATCHES_CSV = gql`
  query cashboxBatchesCsv($from: Date, $until: Date, $timezone: String) {
    cashboxBatchesCsv(from: $from, until: $until, timezone: $timezone)
  }
`

const widths = {
  name: 250,
  cashbox: 200,
  cassettes: 575,
  edit: 90
}

const CashCassettes = () => {
  const classes = useStyles()
  const [showHistory, setShowHistory] = useState(false)
  const [editingSchema, setEditingSchema] = useState(null)
  const [selectedRadio, setSelectedRadio] = useState(null)

  const { data, loading: dataLoading } = useQuery(GET_MACHINES_AND_CONFIG, {
    variables: {
      billFilters: {
        batch: 'none'
      }
    }
  })
  const [wizard, setWizard] = useState(false)
  const [machineId, setMachineId] = useState('')

  const machines = R.path(['machines'])(data) ?? []
  const unpairedMachines = R.path(['unpairedMachines'])(data) ?? []
  const config = R.path(['config'])(data) ?? {}
  const [setCassetteBills, { error }] = useMutation(SET_CASSETTE_BILLS, {
    refetchQueries: () => ['getData']
  })
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: () => setEditingSchema(false),
    refetchQueries: () => ['getData']
  })

  const timezone = R.path(['config', 'locale_timezone'], data)

  const bills = R.groupBy(bill => bill.deviceId)(R.path(['bills'])(data) ?? [])
  const deviceIds = R.uniq(
    R.map(R.prop('deviceId'))(R.path(['bills'])(data) ?? [])
  )
  const cashout = data?.config && fromNamespace('cashOut')(data.config)
  const locale = data?.config && fromNamespace('locale')(data.config)
  const fiatCurrency = locale?.fiatCurrency

  const getCashoutSettings = id => fromNamespace(id)(cashout)

  const onSave = (id, cashUnits) => {
    return setCassetteBills({
      variables: {
        action: 'setCassetteBills',
        deviceId: id,
        cashUnits
      }
    })
  }

  const cashboxReset =
    data?.config && fromNamespace('cashIn')(data.config).cashboxReset

  const cashboxResetSave = rawConfig => {
    const config = toNamespace('cashIn')(rawConfig)
    return saveConfig({ variables: { config } })
  }

  const saveCashboxOption = selection => {
    if (selection) {
      cashboxResetSave({ cashboxReset: selection })
      setEditingSchema(false)
    }
  }

  const radioButtonOptions = [
    { display: 'Automatic', code: AUTOMATIC },
    { display: 'Manual', code: MANUAL }
  ]

  const handleRadioButtons = evt => {
    const selectedRadio = R.path(['target', 'value'])(evt)
    setSelectedRadio(selectedRadio)
  }

  const elements = helper.getElements(
    classes,
    config,
    bills,
    setWizard,
    widths,
    setMachineId
  )

  const InnerCashUnitDetails = ({ it }) => (
    <CashUnitDetails
      machine={it}
      bills={bills[it.id] ?? []}
      currency={fiatCurrency}
      config={config}
    />
  )

  return (
    !dataLoading && (
      <>
        <TitleSection
          title="Cash Boxes & Cassettes"
          buttons={[
            {
              text: 'Cash box history',
              icon: HistoryIcon,
              inverseIcon: ReverseHistoryIcon,
              toggle: setShowHistory
            },
            {
              component: showHistory ? (
                <LogsDowloaderPopover
                  className={classes.downloadLogsButton}
                  title="Download logs"
                  name="cashboxHistory"
                  query={GET_BATCHES_CSV}
                  getLogs={logs => R.path(['cashboxBatchesCsv'])(logs)}
                  timezone={timezone}
                  args={{ timezone }}
                />
              ) : (
                <></>
              )
            }
          ]}
          iconClassName={classes.listViewButton}
          className={classes.tableWidth}>
          {!showHistory && (
            <Box alignItems="center" justifyContent="flex-end">
              <Label1 className={classes.cashboxReset}>Cash box resets</Label1>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="end"
                mr="-4px">
                {cashboxReset && (
                  <P className={classes.selection}>
                    {onlyFirstToUpper(cashboxReset)}
                  </P>
                )}
                <IconButton
                  onClick={() => setEditingSchema(true)}
                  className={classes.button}>
                  <EditIcon />
                </IconButton>
              </Box>
            </Box>
          )}
        </TitleSection>
        {!showHistory && (
          <>
            <DataTable
              loading={dataLoading}
              elements={elements}
              data={machines}
              Details={InnerCashUnitDetails}
              emptyText="No machines so far"
              expandable
              tableClassName={classes.dataTable}
            />

            {data && R.isEmpty(machines) && (
              <EmptyTable message="No machines so far" />
            )}
          </>
        )}
        {showHistory && (
          <CashboxHistory
            machines={R.concat(machines, unpairedMachines)}
            currency={fiatCurrency}
            timezone={timezone}
          />
        )}
        <CashCassettesFooter
          currencyCode={fiatCurrency}
          machines={machines}
          config={config}
          bills={R.path(['bills'])(data)}
          deviceIds={deviceIds}
        />
        {wizard && (
          <Wizard
            machine={R.find(R.propEq('id', machineId), machines)}
            cashoutSettings={getCashoutSettings(machineId)}
            onClose={() => {
              setWizard(false)
            }}
            error={error?.message}
            save={onSave}
            locale={locale}
          />
        )}
        {editingSchema && (
          <Modal
            title={'Cash box resets'}
            width={478}
            handleClose={() => setEditingSchema(null)}
            open={true}>
            <P className={classes.descriptions}>
              We can automatically assume you emptied a bill validator's cash
              box when the machine detects that it has been removed.
            </P>
            <RadioGroup
              name="set-automatic-reset"
              value={selectedRadio ?? cashboxReset}
              options={[radioButtonOptions[0]]}
              onChange={handleRadioButtons}
              className={classes.radioButtons}
            />
            <P className={classes.descriptions}>
              Assume the cash box is emptied whenever it's removed, creating a
              new batch on the history screen and setting its current balance to
              zero.
            </P>
            <RadioGroup
              name="set-manual-reset"
              value={selectedRadio ?? cashboxReset}
              options={[radioButtonOptions[1]]}
              onChange={handleRadioButtons}
              className={classes.radioButtons}
            />
            <P className={classes.descriptions}>
              Cash boxes won't be assumed emptied when removed, nor their counts
              modified. Instead, to update the count and create a new batch,
              you'll click the 'Edit' button on this panel.
            </P>
            <DialogActions className={classes.actions}>
              <Button onClick={() => saveCashboxOption(selectedRadio)}>
                Confirm
              </Button>
            </DialogActions>
          </Modal>
        )}
      </>
    )
  )
}

export default CashCassettes
