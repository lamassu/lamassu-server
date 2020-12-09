import * as R from 'ramda'
import React, { useContext } from 'react'
import * as Yup from 'yup'

import { Table as EditableTable } from 'src/components/editableTable'
import { NumberInput } from 'src/components/inputs/formik/'
import Autocomplete from 'src/components/inputs/formik/Autocomplete'
import { transformNumber } from 'src/utils/number'

import NotificationsCtx from '../NotificationsContext'

// const CASHBOX_KEY = 'cashbox'
const CASSETTE_1_KEY = 'fiatBalanceCassette1'
const CASSETTE_2_KEY = 'fiatBalanceCassette2'
const MACHINE_KEY = 'machine'
const NAME = 'fiatBalanceOverrides'

const FiatBalanceOverrides = ({ section }) => {
  const { machines = [], data, save, isDisabled, setEditing } = useContext(
    NotificationsCtx
  )

  const setupValues = data?.fiatBalanceOverrides ?? []
  const innerSetEditing = it => setEditing(NAME, it)

  const overridenMachines = R.map(override => override.machine, setupValues)
  const suggestionFilter = R.filter(
    it => !R.contains(it.deviceId, overridenMachines)
  )
  const suggestions = suggestionFilter(machines)

  const findSuggestion = it => {
    const coin = R.compose(R.find(R.propEq('deviceId', it?.machine)))(machines)
    return coin ? [coin] : []
  }

  const initialValues = {
    [MACHINE_KEY]: null,
    // [CASHBOX_KEY]: '',
    [CASSETTE_1_KEY]: '',
    [CASSETTE_2_KEY]: ''
  }

  const notesMin = 0
  const notesMax = 9999999
  /* const validationSchema = Yup.object().shape(
    {
      [MACHINE_KEY]: Yup.string()
        .label('Machine')
        .nullable()
        .required(),
      [CASHBOX_KEY]: Yup.number()
        .label('Cashbox')
        .when([CASSETTE_1_KEY, CASSETTE_2_KEY], {
          is: (CASSETTE_1_KEY, CASSETTE_2_KEY) =>
            !CASSETTE_1_KEY && !CASSETTE_2_KEY,
          then: Yup.number().required()
        })
        .transform(transformNumber)
        .integer()
        .min(notesMin)
        .max(notesMax)
        .nullable(),
      [CASSETTE_1_KEY]: Yup.number()
        .label('Cassette 1 (top)')
        .when([CASHBOX_KEY, CASSETTE_2_KEY], {
          is: (CASHBOX_KEY, CASSETTE_2_KEY) => !CASHBOX_KEY && !CASSETTE_2_KEY,
          then: Yup.number().required()
        })
        .transform(transformNumber)
        .integer()
        .min(notesMin)
        .max(notesMax)
        .nullable(),
      [CASSETTE_2_KEY]: Yup.number()
        .label('Cassette 1 (bottom)')
        .when([CASHBOX_KEY, CASSETTE_1_KEY], {
          is: (CASHBOX_KEY, CASSETTE_1_KEY) => !CASHBOX_KEY && !CASSETTE_1_KEY,
          then: Yup.number().required()
        })
        .transform(transformNumber)
        .integer()
        .min(notesMin)
        .max(notesMax)
        .nullable()
    },
    [
      [CASHBOX_KEY, CASSETTE_1_KEY],
      [CASHBOX_KEY, CASSETTE_2_KEY],
      [CASSETTE_1_KEY, CASSETTE_2_KEY]
    ]
  ) */
  const validationSchema = Yup.object().shape(
    {
      [MACHINE_KEY]: Yup.string()
        .label('Machine')
        .nullable()
        .required(),
      [CASSETTE_1_KEY]: Yup.number()
        .label('Cassette 1 (top)')
        .when(CASSETTE_2_KEY, {
          is: CASSETTE_2_KEY => !CASSETTE_2_KEY,
          then: Yup.number().required()
        })
        .transform(transformNumber)
        .integer()
        .min(notesMin)
        .max(notesMax)
        .nullable(),
      [CASSETTE_2_KEY]: Yup.number()
        .label('Cassette 1 (bottom)')
        .when(CASSETTE_1_KEY, {
          is: CASSETTE_1_KEY => !CASSETTE_1_KEY,
          then: Yup.number().required()
        })
        .transform(transformNumber)
        .integer()
        .min(notesMin)
        .max(notesMax)
        .nullable()
    },
    [CASSETTE_1_KEY, CASSETTE_2_KEY]
  )

  const viewMachine = it =>
    R.compose(R.path(['name']), R.find(R.propEq('deviceId', it)))(machines)

  const elements = [
    {
      name: MACHINE_KEY,
      width: 238,
      size: 'sm',
      view: viewMachine,
      input: Autocomplete,
      inputProps: {
        options: it => R.concat(suggestions, findSuggestion(it)),
        valueProp: 'deviceId',
        getLabel: R.path(['name'])
      }
    },
    /* {
      name: CASHBOX_KEY,
      display: 'Cashbox',
      width: 155,
      textAlign: 'right',
      bold: true,
      input: NumberInput,
      suffix: 'notes',
      inputProps: {
        decimalPlaces: 0
      }
    }, */
    {
      name: CASSETTE_1_KEY,
      display: 'Cash-out 1',
      width: 155,
      textAlign: 'right',
      doubleHeader: 'Cash-out (Cassette Empty)',
      bold: true,
      input: NumberInput,
      suffix: 'notes',
      inputProps: {
        decimalPlaces: 0
      }
    },
    {
      name: CASSETTE_2_KEY,
      display: 'Cash-out 2',
      width: 155,
      textAlign: 'right',
      doubleHeader: 'Cash-out (Cassette Empty)',
      bold: true,
      input: NumberInput,
      suffix: 'notes',
      inputProps: {
        decimalPlaces: 0
      }
    }
  ]

  return (
    <EditableTable
      name={NAME}
      title="Overrides"
      enableDelete
      enableEdit
      enableCreate
      save={it => save(section, validationSchema.cast(it))}
      initialValues={initialValues}
      validationSchema={validationSchema}
      forceDisable={isDisabled(NAME) || !machines}
      data={setupValues}
      elements={elements}
      disableAdd={!suggestions?.length}
      setEditing={innerSetEditing}
    />
  )
}

export default FiatBalanceOverrides
