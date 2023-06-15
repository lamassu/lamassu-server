import * as R from 'ramda'
import React from 'react'
import * as uuid from 'uuid'
import * as Yup from 'yup'

import { Table as EditableTable } from 'src/components/editableTable'
import { NumberInput } from 'src/components/inputs/formik/'
import Autocomplete from 'src/components/inputs/formik/Autocomplete'
import { fromNamespace, namespaces } from 'src/utils/config'
import { transformNumber } from 'src/utils/number'

const MAX_NUMBER_OF_CASSETTES_RECYCLERS = 4
const MAX_NUMBER_OF_LOAD_BOXES = 2

const widths = { machine: 130, cashbox: 110, cassette: 104 }

const FiatBalanceOverrides = ({
  data,
  save,
  onDelete,
  error,
  editing,
  setEditing
}) => {
  const { config, machines, notificationSettings } = data
  const eventName = 'unitFillThreshold'
  const values = R.filter(
    it => it.event === eventName && !R.isNil(it.overrideId)
  )(notificationSettings)

  const cashoutConfig = fromNamespace(namespaces.CASH_OUT)(config)
  const getMachineCashoutConfig = it => fromNamespace(it)(cashoutConfig)

  const overriddenMachines = R.map(override => override?.value?.machine, values)
  const suggestions = R.differenceWith(
    (it, m) => it.deviceId === m,
    machines,
    overriddenMachines
  )

  const findSuggestion = it => {
    const machine = R.find(ite => it?.value?.machine === ite.deviceId, machines)
    return machine ? [machine] : []
  }

  const _save = (_, it) => save(schema.cast(it))
  const _delete = id => onDelete(eventName, id)

  const initialValues = {
    event: 'unitFillThreshold',
    overrideId: uuid.v4(),
    value: {
      machine: null,
      cashboxCount: {
        upperBound: null
      },
      rejectBoxCount: {
        upperBound: null
      },
      loadboxPercentage: {
        lowerBound: R.times(() => null, MAX_NUMBER_OF_LOAD_BOXES)
      },
      cassetteAndRecyclerPercentage: {
        lowerBound: R.times(() => null, MAX_NUMBER_OF_CASSETTES_RECYCLERS)
      }
    }
  }

  const notesMin = 0
  const notesMax = 9999999
  const percentMin = 0
  const percentMax = 100

  const schema = Yup.object()
    .shape({
      event: Yup.string().required(),
      overrideId: Yup.string().required(),
      value: Yup.object().shape({
        machine: Yup.string().required(),
        cashboxCount: Yup.object().shape({
          upperBound: Yup.number()
            .transform(transformNumber)
            .integer()
            .min(notesMin)
            .max(notesMax)
            .nullable()
        }),
        rejectBoxCount: Yup.object().shape({
          upperBound: Yup.number()
            .transform(transformNumber)
            .integer()
            .min(notesMin)
            .max(notesMax)
            .nullable()
        }),
        loadboxPercentage: Yup.object().shape({
          lowerBound: Yup.array()
            .of(
              Yup.number()
                .transform(transformNumber)
                .integer()
                .min(percentMin)
                .max(percentMax)
                .nullable()
            )
            .length(MAX_NUMBER_OF_LOAD_BOXES)
        }),
        cassetteAndRecyclerPercentage: Yup.object().shape({
          lowerBound: Yup.array()
            .of(
              Yup.number()
                .transform(transformNumber)
                .integer()
                .min(percentMin)
                .max(percentMax)
                .nullable()
            )
            .length(MAX_NUMBER_OF_CASSETTES_RECYCLERS)
        })
      })
    })
    .test((values, context) => {
      const { value } = values
      const fieldValues = R.pipe(
        R.props([
          'cashboxCount',
          'loadboxPercentage',
          'cassetteAndRecyclerPercentage'
        ]),
        R.map(R.values),
        R.flatten
      )(value)
      return R.all(R.isNil)(fieldValues)
        ? context.createError({
            path: 'value',
            message:
              'The cash box or at least one of the cassettes must have a value'
          })
        : undefined
    })

  const viewMachine = it =>
    R.compose(R.path(['name']), R.find(R.propEq('deviceId', it)))(machines)

  const getMachine = id => R.find(it => it.deviceId === id)(machines)

  const elements = [
    {
      name: 'value.machine',
      display: 'Machine',
      width: widths.machine,
      size: 'sm',
      view: viewMachine,
      input: Autocomplete,
      inputProps: {
        options: (_, it) => R.concat(suggestions, findSuggestion(it)),
        valueProp: 'deviceId',
        labelProp: 'name'
      }
    },
    {
      name: 'value.cashboxCount.upperBound',
      display: 'Cash box',
      width: widths.cashbox,
      textAlign: 'right',
      bold: true,
      input: NumberInput,
      suffix: 'notes',
      inputProps: {
        decimalPlaces: 0
      }
    },
    ...R.map(
      it => ({
        name: `value.loadboxPercentage.lowerBound.${it - 1}`,
        display: `LB ${it}`,
        width: widths.cassette,
        textAlign: 'right',
        doubleHeader: 'Cassettes & Recyclers (Empty)',
        bold: true,
        input: NumberInput,
        suffix: '%',
        inputProps: {
          decimalPlaces: 0
        },
        view: el => R.defaultTo('—', el),
        isHidden: override => {
          const m = getMachine(override.value.machine)
          if (R.isNil(m) || m?.model !== 'aveiro') return true
          return (
            !getMachineCashoutConfig(m.deviceId).active ||
            it > R.defaultTo(0, m?.numberOfCassettes)
          )
        }
      }),
      R.range(1, MAX_NUMBER_OF_LOAD_BOXES + 1)
    ),
    ...R.map(
      it => ({
        name: `value.cassetteAndRecyclerPercentage.lowerBound.${it - 1}`,
        display: `Cass ${it}`,
        width: widths.cassette,
        textAlign: 'right',
        doubleHeader: 'Cassettes & Recyclers (Empty)',
        bold: true,
        input: NumberInput,
        suffix: '%',
        inputProps: {
          decimalPlaces: 0
        },
        view: el => R.defaultTo('—', el),
        isHidden: override => {
          const m = getMachine(override.value.machine)
          if (R.isNil(m)) return true

          if (m?.model === 'aveiro') {
            return (
              !getMachineCashoutConfig(m.deviceId).active ||
              it > R.defaultTo(0, m?.numberOfStackers)
            )
          }

          return (
            !getMachineCashoutConfig(m.deviceId).active ||
            it > R.defaultTo(0, m?.numberOfCassettes)
          )
        }
      }),
      R.range(1, MAX_NUMBER_OF_CASSETTES_RECYCLERS + 1)
    )
  ]

  return (
    <EditableTable
      name="overrides"
      title="Overrides"
      error={error?.message}
      enableDelete
      enableEdit
      enableCreate
      save={_save}
      onDelete={_delete}
      initialValues={initialValues}
      validationSchema={schema}
      forceDisable={R.isEmpty(machines) || R.isNil(machines)}
      data={values}
      elements={elements}
      disableAdd={!suggestions?.length}
      editing={editing}
      setEditing={setEditing}
    />
  )
}

export default FiatBalanceOverrides
