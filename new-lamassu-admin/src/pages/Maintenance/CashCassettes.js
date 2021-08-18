import { useQuery, useMutation } from '@apollo/react-hooks'
import { DialogActions, makeStyles, Box } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

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

const ValidationSchema = Yup.object().shape({
  name: Yup.string().required(),
  cashbox: Yup.number()
    .label('Cashbox')
    .required()
    .integer()
    .min(0)
    .max(1000),
  cassette1: Yup.number()
    .label('Cassette 1 (top)')
    .required()
    .integer()
    .min(0)
    .max(500),
  cassette2: Yup.number()
    .label('Cassette 2 (bottom)')
    .required()
    .integer()
    .min(0)
    .max(500)
})

const GET_MACHINES_AND_CONFIG = gql`
  query getData {
    machines {
      name
      id: deviceId
      cashbox
      cassette1
      cassette2
    }
    config
  }
`
const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

/* 
  // for cash in total calculation
  bills {
    fiat
    deviceId
    created
    cashbox
  }
*/

const SET_CASSETTE_BILLS = gql`
  mutation MachineAction(
    $deviceId: ID!
    $action: MachineAction!
    $cashbox: Int!
    $cassette1: Int!
    $cassette2: Int!
  ) {
    machineAction(
      deviceId: $deviceId
      action: $action
      cashbox: $cashbox
      cassette1: $cassette1
      cassette2: $cassette2
    ) {
      deviceId
      cashbox
      cassette1
      cassette2
    }
  }
`

const CashCassettes = () => {
  const classes = useStyles()
  const [showHistory, setShowHistory] = useState(false)
  const [editingSchema, setEditingSchema] = useState(null)
  const [selectedRadio, setSelectedRadio] = useState(null)

  const { data } = useQuery(GET_MACHINES_AND_CONFIG)
  const [wizard, setWizard] = useState(false)
  const [machineId, setMachineId] = useState('')

  const machines = R.path(['machines'])(data) ?? []
  const config = R.path(['config'])(data) ?? {}
  const [setCassetteBills, { error }] = useMutation(SET_CASSETTE_BILLS, {
    refetchQueries: () => ['getData']
  })
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: () => setEditingSchema(false),
    refetchQueries: () => ['getData']
  })

  const bills = R.groupBy(bill => bill.deviceId)(R.path(['bills'])(data) ?? [])
  const deviceIds = R.uniq(
    R.map(R.prop('deviceId'))(R.path(['bills'])(data) ?? [])
  )
  const cashout = data?.config && fromNamespace('cashOut')(data.config)
  const locale = data?.config && fromNamespace('locale')(data.config)
  const fiatCurrency = locale?.fiatCurrency

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
  const onSave = (id, cashbox, cassette1, cassette2) => {
    return setCassetteBills({
      variables: {
        action: 'setCassetteBills',
        deviceId: id,
        cashbox,
        cassette1,
        cassette2
      }
    })
  }
  const getCashoutSettings = id => fromNamespace(id)(cashout)
  const isCashOutDisabled = ({ id }) => !getCashoutSettings(id).active

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
      width: 254,
      view: name => <>{name}</>,
      input: ({ field: { value: name } }) => <>{name}</>
    },
    {
      name: 'cashbox',
      header: 'Cashbox',
      width: 240,
      view: value => (
        <CashIn currency={{ code: fiatCurrency }} notes={value} total={0} />
      ),
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      }
    },
    {
      name: 'cassette1',
      header: 'Cassette 1 (Top)',
      width: 265,
      stripe: true,
      view: (value, { id }) => (
        <CashOut
          className={classes.cashbox}
          denomination={getCashoutSettings(id)?.top}
          currency={{ code: fiatCurrency }}
          notes={value}
        />
      ),
      input: CashCassetteInput,
      inputProps: {
        decimalPlaces: 0
      }
    },
    {
      name: 'cassette2',
      header: 'Cassette 2 (Bottom)',
      width: 265,
      stripe: true,
      view: (value, { id }) => {
        return (
          <CashOut
            className={classes.cashbox}
            denomination={getCashoutSettings(id)?.bottom}
            currency={{ code: fiatCurrency }}
            notes={value}
          />
        )
      },
      input: CashCassetteInput,
      inputProps: {
        decimalPlaces: 0
      }
    },
    {
      name: 'edit',
      header: 'Edit',
      width: 175,
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
    }
  ]

  return (
    <>
      <TitleSection
        title="Cash Cassettes"
        button={{
          text: 'Cashbox history',
          icon: HistoryIcon,
          inverseIcon: ReverseHistoryIcon,
          toggle: setShowHistory
        }}
        iconClassName={classes.listViewButton}
        className={classes.tableWidth}>
        {!showHistory && (
          <Box alignItems="center" justifyContent="flex-end">
            <Label1 className={classes.cashboxReset}>Cashbox reset</Label1>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="flex-end"
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
      <div className={classes.tableContainer}>
        {!showHistory && (
          <>
            <EditableTable
              error={error?.message}
              name="cashboxes"
              stripeWhen={isCashOutDisabled}
              elements={elements}
              data={machines}
              save={onSave}
              validationSchema={ValidationSchema}
              tbodyWrapperClass={classes.tBody}
            />

            {data && R.isEmpty(machines) && (
              <EmptyTable message="No machines so far" />
            )}
          </>
        )}
        {showHistory && (
          <CashboxHistory machines={machines} currency={fiatCurrency} />
        )}
        {showHistory && <CashboxHistory machines={machines} />}
      </div>
      <CashCassettesFooter
        currencyCode={fiatCurrency}
        machines={machines}
        config={config}
        bills={bills}
        deviceIds={deviceIds}
      />
      {wizard && (
        <Wizard
          machine={R.find(R.propEq('id', machineId))(machines)}
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
          title={'Cashbox reset'}
          width={478}
          handleClose={() => setEditingSchema(null)}
          open={true}>
          <P className={classes.descriptions}>
            Specify if you want your cash-in counts to be reset automatically or
            manually.
          </P>
          <RadioGroup
            name="set-automatic-reset"
            value={selectedRadio ?? cashboxReset}
            options={[radioButtonOptions[0]]}
            onChange={handleRadioButtons}
            className={classes.radioButtons}
          />
          <P className={classes.descriptions}>
            Choose this option if you want your cash-in cashbox count to be
            reset automatically when it is physically removed from the machine.
          </P>
          <RadioGroup
            name="set-manual-reset"
            value={selectedRadio ?? cashboxReset}
            options={[radioButtonOptions[1]]}
            onChange={handleRadioButtons}
            className={classes.radioButtons}
          />
          <P className={classes.descriptions}>
            Choose this option if you want to edit your cash-in counts manually
            on Lamassu Admin, after you physically remove the bills from the
            cashbox.
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
}

export default CashCassettes
