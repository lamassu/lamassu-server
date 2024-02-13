import * as R from 'ramda'
import * as Yup from 'yup'

import { Autocomplete, NumberInput } from 'src/components/inputs/formik'
import { bold } from 'src/styling/helpers'
import denominations from 'src/utils/bill-denominations'
import { getBillOptions } from 'src/utils/bill-options'
import { CURRENCY_MAX } from 'src/utils/constants'
import { transformNumber } from 'src/utils/number'

const widthsByNumberOfUnits = {
  2: { machine: 325, cassette: 340 },
  3: { machine: 300, cassette: 235 },
  4: { machine: 205, cassette: 200 },
  5: { machine: 180, cassette: 165 },
  6: { machine: 165, cassette: 140 },
  7: { machine: 130, cassette: 125 }
}

const denominationKeys = [
  'cassette1',
  'cassette2',
  'cassette3',
  'cassette4',
  'recycler1',
  'recycler2',
  'recycler3',
  'recycler4',
  'recycler5',
  'recycler6'
]

const DenominationsSchema = Yup.object()
  .shape({
    cassette1: Yup.number()
      .label('Cassette 1')
      .min(1)
      .nullable()
      .max(CURRENCY_MAX),
    cassette2: Yup.number()
      .label('Cassette 2')
      .min(1)
      .max(CURRENCY_MAX)
      .nullable()
      .transform(transformNumber),
    cassette3: Yup.number()
      .label('Cassette 3')
      .min(1)
      .max(CURRENCY_MAX)
      .nullable()
      .transform(transformNumber),
    cassette4: Yup.number()
      .label('Cassette 4')
      .min(1)
      .max(CURRENCY_MAX)
      .nullable()
      .transform(transformNumber),
    recycler1: Yup.number()
      .label('Recycler 1')
      .min(1)
      .max(CURRENCY_MAX)
      .nullable()
      .transform(transformNumber),
    recycler2: Yup.number()
      .label('Recycler 2')
      .min(1)
      .max(CURRENCY_MAX)
      .nullable()
      .transform(transformNumber),
    recycler3: Yup.number()
      .label('Recycler 3')
      .min(1)
      .max(CURRENCY_MAX)
      .nullable()
      .transform(transformNumber),
    recycler4: Yup.number()
      .label('Recycler 4')
      .min(1)
      .max(CURRENCY_MAX)
      .nullable()
      .transform(transformNumber),
    recycler5: Yup.number()
      .label('Recycler 5')
      .min(1)
      .max(CURRENCY_MAX)
      .nullable()
      .transform(transformNumber),
    recycler6: Yup.number()
      .label('Recycler 6')
      .min(1)
      .max(CURRENCY_MAX)
      .nullable()
      .transform(transformNumber)
  })
  .test((values, context) =>
    R.any(key => !R.isNil(values[key]), denominationKeys)
      ? true
      : context.createError({
          path: '',
          message:
            'The recyclers or at least one of the cassettes must have a value'
        })
  )

const getElements = (machines, locale = {}, classes) => {
  const fiatCurrency = R.prop('fiatCurrency')(locale)
  const maxNumberOfCassettes = Math.max(
    ...R.map(it => it.numberOfCassettes, machines),
    0
  )
  const maxNumberOfRecyclers = Math.max(
    ...R.map(it => it.numberOfRecyclers, machines),
    0
  )
  const numberOfCashUnits =
    maxNumberOfCassettes + Math.ceil(maxNumberOfRecyclers / 2)

  const options = getBillOptions(locale, denominations)
  const cassetteProps =
    options?.length > 0
      ? {
          options: options,
          labelProp: 'display',
          valueProp: 'code',
          className: classes.autoComplete
        }
      : { decimalPlaces: 0 }

  const elements = [
    {
      name: 'id',
      header: 'Machine',
      width: widthsByNumberOfUnits[numberOfCashUnits]?.machine,
      view: it => machines.find(({ deviceId }) => deviceId === it).name,
      size: 'sm',
      editable: false
    }
  ]

  R.until(
    R.gt(R.__, maxNumberOfCassettes),
    it => {
      elements.push({
        name: `cassette${it}`,
        header: `Cassette ${it}`,
        size: 'sm',
        stripe: true,
        textAlign: 'right',
        width: widthsByNumberOfUnits[numberOfCashUnits]?.cassette,
        suffix: fiatCurrency,
        bold: bold,
        view: it => it,
        input: options?.length > 0 ? Autocomplete : NumberInput,
        inputProps: cassetteProps,
        doubleHeader: 'Denominations of Cassettes & Recyclers',
        isHidden: machine =>
          it >
          machines.find(({ deviceId }) => deviceId === machine.id)
            .numberOfCassettes
      })
      return R.add(1, it)
    },
    1
  )

  R.until(
    R.gt(R.__, Math.ceil(maxNumberOfRecyclers / 2)),
    it => {
      elements.push({
        names: [`recycler${it * 2 - 1}`, `recycler${it * 2}`],
        header: `Recyclers ${it * 2 - 1} - ${it * 2}`,
        size: 'sm',
        stripe: true,
        textAlign: 'right',
        width: widthsByNumberOfUnits[numberOfCashUnits]?.cassette,
        suffix: fiatCurrency,
        bold: bold,
        input: options?.length > 0 ? Autocomplete : NumberInput,
        inputProps: cassetteProps,
        doubleHeader: 'Denominations of Cassettes & Recyclers',
        isHidden: machine =>
          it >
          Math.ceil(
            machines.find(({ deviceId }) => deviceId === machine.id)
              .numberOfRecyclers / 2
          )
      })
      return R.add(1, it)
    },
    1
  )

  return elements
}

export { DenominationsSchema, getElements }
