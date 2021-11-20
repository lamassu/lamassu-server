import * as R from 'ramda'
import * as Yup from 'yup'

import { NumberInput } from 'src/components/inputs/formik'
import { transformNumber } from 'src/utils/number'

const currencyMax = 999999999
const DenominationsSchema = Yup.object().shape({
  cassette1: Yup.number()
    .label('Cassette 1')
    .required()
    .min(1)
    .max(currencyMax),
  cassette2: Yup.number()
    .label('Cassette 2')
    .required()
    .min(1)
    .max(currencyMax),
  cassette3: Yup.number()
    .label('Cassette 3')
    .min(1)
    .max(currencyMax)
    .nullable()
    .transform(transformNumber),
  cassette4: Yup.number()
    .label('Cassette 4')
    .min(1)
    .max(currencyMax)
    .nullable()
    .transform(transformNumber),
  zeroConfLimit: Yup.number()
    .label('0-conf Limit')
    .required()
    .min(0)
    .max(currencyMax)
})

const getElements = (machines, { fiatCurrency } = {}) => {
  const maxNumberOfCassettes = Math.max(
    ...R.map(it => it.numberOfCassettes, machines)
  )

  const elements = [
    {
      name: 'id',
      header: 'Machine',
      width: 200,
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
        width: (maxNumberOfCassettes > 2 ? 600 : 460) / maxNumberOfCassettes,
        input: NumberInput,
        inputProps: {
          decimalPlaces: 0
        },
        suffix: fiatCurrency,
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

  elements.push({
    name: 'zeroConfLimit',
    header: '0-conf Limit',
    size: 'sm',
    stripe: true,
    textAlign: 'right',
    width: maxNumberOfCassettes > 2 ? 150 : 290,
    input: NumberInput,
    inputProps: {
      decimalPlaces: 0
    },
    suffix: fiatCurrency
  })

  return elements
}

export { DenominationsSchema, getElements }
