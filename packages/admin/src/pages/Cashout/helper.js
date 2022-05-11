import * as R from 'ramda'
import * as Yup from 'yup'

import { Autocomplete, NumberInput } from 'src/components/inputs/formik'
import { bold } from 'src/styling/helpers'
import denominations from 'src/utils/bill-denominations'
import { getBillOptions } from 'src/utils/bill-options'
import { CURRENCY_MAX } from 'src/utils/constants'
import { transformNumber } from 'src/utils/number'

const widthsByNumberOfCassettes = {
  2: { machine: 300, cassette: 225, zeroConf: 200 },
  3: { machine: 210, cassette: 180, zeroConf: 200 },
  4: { machine: 200, cassette: 150, zeroConf: 150 }
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
      width: widthsByNumberOfCassettes[maxNumberOfCassettes]?.machine,
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
        width: widthsByNumberOfCassettes[maxNumberOfCassettes]?.cassette,
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

  return elements
}

export { DenominationsSchema, getElements }
