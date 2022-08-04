import { useQuery, useMutation, gql } from '@apollo/client'
import { DialogActions, makeStyles, Box } from '@material-ui/core'
import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import LogsDowloaderPopover from 'src/components/LogsDownloaderPopper'
import Modal from 'src/components/Modal'
import { IconButton, Button } from 'src/components/buttons'
import { Table as EditableTable } from 'src/components/editableTable'
import { RadioGroup } from 'src/components/inputs'
import { CashOut, CashIn } from 'src/components/inputs/cashbox/Cashbox'
import { NumberInput, CashCassetteInput } from 'src/components/inputs/formik'
import TitleSection from 'src/components/layout/TitleSection'
import { EmptyTable } from 'src/components/table'
import { P, Label1 } from 'src/components/typography'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as ReverseHistoryIcon } from 'src/styling/icons/circle buttons/history/white.svg'
import { ReactComponent as HistoryIcon } from 'src/styling/icons/circle buttons/history/zodiac.svg'
import { fromNamespace, toNamespace } from 'src/utils/config'
import { MANUAL, AUTOMATIC } from 'src/utils/constants.js'
import { onlyFirstToUpper } from 'src/utils/string'

import styles from './CashCassettes.styles.js'
import CashCassettesFooter from './CashCassettesFooter'
import CashboxHistory from './CashboxHistory'
import Wizard from './Wizard/Wizard'

const useStyles = makeStyles(styles)

const widthsByNumberOfCassettes = {
  2: {
    machine: 250,
    cashbox: 260,
    cassette: 300,
    cassetteGraph: 80,
    editWidth: 90
  },
  3: {
    machine: 220,
    cashbox: 215,
    cassette: 225,
    cassetteGraph: 60,
    editWidth: 90
  },
  4: {
    machine: 190,
    cashbox: 180,
    cassette: 185,
    cassetteGraph: 50,
    editWidth: 90
  }
}

const ValidationSchema = Yup.object().shape({
  name: Yup.string().required(),
  cashbox: Yup.number()
    .label('Cash box')
    .required()
    .integer()
    .min(0)
    .max(1000),
  cassette1: Yup.number()
    .label('Cassette 1')
    .required()
    .integer()
    .min(0)
    .max(500),
  cassette2: Yup.number()
    .label('Cassette 2')
    .required()
    .integer()
    .min(0)
    .max(500),
  cassette3: Yup.number()
    .label('Cassette 3')
    .required()
    .integer()
    .min(0)
    .max(500),
  cassette4: Yup.number()
    .label('Cassette 4')
    .required()
    .integer()
    .min(0)
    .max(500)
})

const GET_MACHINES_AND_CONFIG = gql`
  query getData($billFilters: JSONObject) {
    machines {
      name
      id: deviceId
      cashbox
      cassette1
      cassette2
      cassette3
      cassette4
      numberOfCassettes
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
    $cashbox: Int!
    $cassette1: Int!
    $cassette2: Int!
    $cassette3: Int!
    $cassette4: Int!
  ) {
    machineAction(
      deviceId: $deviceId
      action: $action
      cashbox: $cashbox
      cassette1: $cassette1
      cassette2: $cassette2
      cassette3: $cassette3
      cassette4: $cassette4
    ) {
      deviceId
      cashbox
      cassette1
      cassette2
      cassette3
      cassette4
    }
  }
`

const GET_BATCHES_CSV = gql`
  query cashboxBatchesCsv($from: Date, $until: Date, $timezone: String) {
    cashboxBatchesCsv(from: $from, until: $until, timezone: $timezone)
  }
`

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
  const fillingPercentageSettings = fromNamespace('notifications', config)
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
  const maxNumberOfCassettes = Math.max(
    ...R.map(it => it.numberOfCassettes, machines),
    0
  )

  const getCashoutSettings = id => fromNamespace(id)(cashout)
  const isCashOutDisabled = ({ id }) => !getCashoutSettings(id).active

  const onSave = (id, cashbox, cassettes) => {
    return setCassetteBills({
      variables: {
        action: 'setCassetteBills',
        deviceId: id,
        cashbox,
        ...cassettes
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

  const elements = [
    {
      name: 'name',
      header: 'Machine',
      width: widthsByNumberOfCassettes[maxNumberOfCassettes]?.machine,
      view: name => <>{name}</>,
      input: ({ field: { value: name } }) => <>{name}</>
    },
    {
      name: 'cashbox',
      header: 'Cash box',
      width: widthsByNumberOfCassettes[maxNumberOfCassettes]?.cashbox,
      view: (value, { id }) => (
        <CashIn
          currency={{ code: fiatCurrency }}
          notes={value}
          total={R.sum(R.map(it => it.fiat, bills[id] ?? []))}
        />
      ),
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      }
    }
  ]

  R.until(
    R.gt(R.__, maxNumberOfCassettes),
    it => {
      elements.push({
        name: `cassette${it}`,
        header: `Cassette ${it}`,
        width: widthsByNumberOfCassettes[maxNumberOfCassettes]?.cassette,
        stripe: true,
        doubleHeader: 'Cash-out',
        view: (value, { id }) => (
          <CashOut
            className={classes.cashbox}
            denomination={getCashoutSettings(id)?.[`cassette${it}`]}
            currency={{ code: fiatCurrency }}
            notes={value}
            width={
              widthsByNumberOfCassettes[maxNumberOfCassettes]?.cassetteGraph
            }
            threshold={
              fillingPercentageSettings[`fillingPercentageCassette${it}`]
            }
          />
        ),
        isHidden: ({ numberOfCassettes }) => it > numberOfCassettes,
        input: CashCassetteInput,
        inputProps: {
          decimalPlaces: 0,
          width: widthsByNumberOfCassettes[maxNumberOfCassettes]?.cassetteGraph,
          inputClassName: classes.cashbox
        }
      })
      return R.add(1, it)
    },
    1
  )

  elements.push({
    name: 'edit',
    header: 'Edit',
    width: widthsByNumberOfCassettes[maxNumberOfCassettes]?.editWidth,
    textAlign: 'center',
    view: (value, { id }) => {
      return (
        <IconButton
          onClick={() => {
            setMachineId(id)
            setWizard(true)
          }}>
          <EditIcon />
        </IconButton>
      )
    }
  })

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
            <EditableTable
              error={error?.message}
              name="cashboxes"
              stripeWhen={isCashOutDisabled}
              elements={elements}
              data={machines}
              validationSchema={ValidationSchema}
              tbodyWrapperClass={classes.tBody}
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
