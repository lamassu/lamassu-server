import * as Yup from 'yup'

import { NumberInput } from 'src/components/inputs/formik'
import { bold } from 'src/styling/helpers'

const currencyMax = 999999999
const DenominationsSchema = Yup.object().shape({
  top: Yup.number()
    .label('Cassette 1 (Top)')
    .required()
    .min(1)
    .max(currencyMax),
  bottom: Yup.number()
    .label('Cassette 2 (Bottom)')
    .required()
    .min(1)
    .max(currencyMax)
})

const getElements = (machines, { fiatCurrency } = {}) => {
  return [
    {
      name: 'id',
      header: 'Machine',
      width: 300,
      view: it => machines.find(({ deviceId }) => deviceId === it).name,
      size: 'sm',
      editable: false
    },
    {
      name: 'top',
      header: 'Cassette 1 (Top)',
      stripe: true,
      width: 250,
      textAlign: 'right',
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      },
      suffix: fiatCurrency,
      bold: bold
    },
    {
      name: 'bottom',
      header: 'Cassette 2 (Bottom)',
      size: 'sm',
      stripe: true,
      textAlign: 'right',
      width: 250,
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      },
      suffix: fiatCurrency
    }
  ]
}

export { DenominationsSchema, getElements }
