import * as R from 'ramda'
import * as Yup from 'yup'

import { Autocomplete, NumberInput } from 'src/components/inputs/formik'
import { bold } from 'src/styling/helpers'
import denominations from 'src/utils/bill-denominations'
import { getBillOptions } from 'src/utils/bill-options'
import { CURRENCY_MAX } from 'src/utils/constants'
import { transformNumber } from 'src/utils/number'

const widthsByNumberOfCassettes = {
  2: { machine: 320, cassette: 315 },
  3: { machine: 305, cassette: 215 },
  4: { machine: 195, cassette: 190 },
  5: { machine: 175, cassette: 155 },
  6: { machine: 170, cassette: 130 },
  7: { machine: 140, cassette: 125 },
  8: { machine: 120, cassette: 125 }
}

const DenominationsSchema = Yup.object().shape({
  cassette1: Yup.number()
    .label('Cassette 1')
    .required()
    .min(1)
    .max(CURRENCY_MAX),
  cassette2: Yup.number()
    .label('Cassette 2')
    .required()
    .min(1)
    .max(CURRENCY_MAX),
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
    .transform(transformNumber)
})

const getElements = (machines, locale = {}, classes) => {
  const fiatCurrency = R.prop('fiatCurrency')(locale)
  const maxNumberOfCassettes = Math.max(
    ...R.map(it => it.numberOfCassettes, machines),
    0
  )
  const maxNumberOfStackers = Math.max(
    ...R.map(it => it.numberOfStackers, machines),
    0
  )
  const maxNumberOfCashUnits = Math.max(
    ...R.map(it => it.numberOfCassettes + it.numberOfStackers * 2, machines),
    0
  )

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
      width: widthsByNumberOfCassettes[maxNumberOfCashUnits]?.machine,
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
        width: widthsByNumberOfCassettes[maxNumberOfCashUnits]?.cassette,
        suffix: fiatCurrency,
        bold: bold,
        view: it => it,
        input: options?.length > 0 ? Autocomplete : NumberInput,
        inputProps: cassetteProps,
        doubleHeader: 'Denominations',
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
    R.gt(R.__, maxNumberOfStackers),
    it => {
      elements.push(
        {
          name: `stacker${it}f`,
          header: `Stacker ${it}F`,
          size: 'sm',
          stripe: true,
          textAlign: 'right',
          width: widthsByNumberOfCassettes[maxNumberOfCashUnits]?.cassette,
          suffix: fiatCurrency,
          bold: bold,
          view: it => it,
          input: options?.length > 0 ? Autocomplete : NumberInput,
          inputProps: cassetteProps,
          doubleHeader: 'Denominations',
          isHidden: machine =>
            it >
            machines.find(({ deviceId }) => deviceId === machine.id)
              .numberOfStackers
        },
        {
          name: `stacker${it}r`,
          header: `Stacker ${it}R`,
          size: 'sm',
          stripe: true,
          textAlign: 'right',
          width: widthsByNumberOfCassettes[maxNumberOfCashUnits]?.cassette,
          suffix: fiatCurrency,
          bold: bold,
          view: it => it,
          input: options?.length > 0 ? Autocomplete : NumberInput,
          inputProps: cassetteProps,
          doubleHeader: 'Denominations',
          isHidden: machine =>
            it >
            machines.find(({ deviceId }) => deviceId === machine.id)
              .numberOfStackers
        }
      )
      return R.add(1, it)
    },
    1
  )

  return elements
}

export { DenominationsSchema, getElements }
