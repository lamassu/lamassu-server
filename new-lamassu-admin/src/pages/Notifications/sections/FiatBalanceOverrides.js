/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import * as R from 'ramda'
import React from 'react'
import * as Yup from 'yup'

import { Table as EditableTable } from 'src/components/editableTable'
import { NumberInput } from 'src/components/inputs/formik/'
import Autocomplete from 'src/components/inputs/formik/Autocomplete'
import { transformNumber } from 'src/utils/number'

const CASHBOX_KEY = 'cashInAlertThreshold'
const CASSETTE_1_KEY = 'fillingPercentageCassette1'
const CASSETTE_2_KEY = 'fillingPercentageCassette2'
const CASSETTE_3_KEY = 'fillingPercentageCassette3'
const CASSETTE_4_KEY = 'fillingPercentageCassette4'
const MACHINE_KEY = 'machine'
const NAME = 'fiatBalanceOverrides'
const DEFAULT_NUMBER_OF_CASSETTES = 2

const CASSETTE_LIST = [
  CASSETTE_1_KEY,
  CASSETTE_2_KEY,
  CASSETTE_3_KEY,
  CASSETTE_4_KEY
]

const widthsByNumberOfCassettes = {
  2: { machine: 230, cashbox: 150, cassette: 250 },
  3: { machine: 216, cashbox: 150, cassette: 270 },
  4: { machine: 210, cashbox: 150, cassette: 204 }
}

const FiatBalanceOverrides = ({ data, save, error, editing, setEditing }) => {
  const { machines, notificationSettings } = data

  const setupValues = data?.fiatBalanceOverrides ?? []
  const innerSetEditing = it => setEditing(it.overrideId)

  const overriddenMachines = R.map(override => override.machine, setupValues)
  const suggestions = R.differenceWith(
    (it, m) => it.deviceId === m,
    machines,
    overriddenMachines
  )

  const findSuggestion = it => {
    const coin = R.find(R.propEq('deviceId', it?.machine), machines)
    return coin ? [coin] : []
  }

  const initialValues = {
    [MACHINE_KEY]: null,
    [CASHBOX_KEY]: '',
    [CASSETTE_1_KEY]: '',
    [CASSETTE_2_KEY]: '',
    [CASSETTE_3_KEY]: '',
    [CASSETTE_4_KEY]: ''
  }

  const notesMin = 0
  const notesMax = 9999999

  const maxNumberOfCassettes = Math.max(
    ...R.map(it => it.numberOfCassettes, machines),
    DEFAULT_NUMBER_OF_CASSETTES
  )

  const percentMin = 0
  const percentMax = 100
  const validationSchema = Yup.object()
    .shape({
      [MACHINE_KEY]: Yup.string()
        .label('Machine')
        .required(),
      [CASHBOX_KEY]: Yup.number()
        .label('Cash box')
        .transform(transformNumber)
        .integer()
        .min(notesMin)
        .max(notesMax)
        .nullable(),
      [CASSETTE_1_KEY]: Yup.number()
        .label('Cassette 1')
        .transform(transformNumber)
        .integer()
        .min(percentMin)
        .max(percentMax)
        .nullable(),
      [CASSETTE_2_KEY]: Yup.number()
        .label('Cassette 2')
        .transform(transformNumber)
        .integer()
        .min(percentMin)
        .max(percentMax)
        .nullable(),
      [CASSETTE_3_KEY]: Yup.number()
        .label('Cassette 3')
        .transform(transformNumber)
        .integer()
        .min(percentMin)
        .max(percentMax)
        .nullable(),
      [CASSETTE_4_KEY]: Yup.number()
        .label('Cassette 4')
        .transform(transformNumber)
        .integer()
        .min(percentMin)
        .max(percentMax)
        .nullable()
    })
    .test((values, context) =>
      R.any(key => !R.isNil(values[key]), R.prepend(CASHBOX_KEY, CASSETTE_LIST))
        ? undefined
        : context.createError({
            path: CASHBOX_KEY,
            message:
              'The cash box or at least one of the cassettes must have a value'
          })
    )

  const viewMachine = it =>
    R.compose(R.path(['name']), R.find(R.propEq('deviceId', it)))(machines)

  const elements = R.concat(
    [
      {
        name: MACHINE_KEY,
        display: 'Machine',
        width: widthsByNumberOfCassettes[maxNumberOfCassettes].machine,
        size: 'sm',
        view: viewMachine,
        input: Autocomplete,
        inputProps: {
          options: it => R.concat(suggestions, findSuggestion(it)),
          valueProp: 'deviceId',
          labelProp: 'name'
        }
      },
      {
        name: CASHBOX_KEY,
        display: 'Cash box',
        width: widthsByNumberOfCassettes[maxNumberOfCassettes].cashbox,
        textAlign: 'right',
        bold: true,
        input: NumberInput,
        suffix: 'notes',
        inputProps: {
          decimalPlaces: 0
        }
      }
    ],
    R.map(
      it => ({
        name: `fillingPercentageCassette${it}`,
        display: `Cash cassette ${it}`,
        width: widthsByNumberOfCassettes[maxNumberOfCassettes].cassette,
        textAlign: 'right',
        doubleHeader: 'Cash Cassette Empty',
        bold: true,
        input: NumberInput,
        suffix: '%',
        inputProps: {
          decimalPlaces: 0
        },
        view: el => el?.toString() ?? '—',
        isHidden: value =>
          !cashoutConfig(value.machine).active ||
          it >
            R.defaultTo(
              0,
              machines.find(({ deviceId }) => deviceId === value.machine)
                ?.numberOfCassettes
            )
      }),
      R.range(1, maxNumberOfCassettes + 1)
    )
  )

  return (
    <EditableTable
      name={NAME}
      title="Overrides"
      error={error?.message}
      enableDelete
      enableEdit
      enableCreate
      save={it => save(validationSchema.cast(it))}
      initialValues={initialValues}
      validationSchema={validationSchema}
      forceDisable={R.isEmpty(machines) || R.isNil(machines)}
      data={setupValues}
      elements={elements}
      disableAdd={!suggestions?.length}
      setEditing={innerSetEditing}
    />
  )
}

export default FiatBalanceOverrides
