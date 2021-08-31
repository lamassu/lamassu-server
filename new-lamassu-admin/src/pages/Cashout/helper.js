import * as Yup from 'yup'

import { NumberInput } from 'src/components/inputs/formik'

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
    .required()
    .min(1)
    .max(currencyMax),
  cassette4: Yup.number()
    .label('Cassette 4')
    .required()
    .min(1)
    .max(currencyMax),
  zeroConfLimit: Yup.number()
    .label('0-conf Limit')
    .required()
    .min(0)
    .max(currencyMax)
})

const getElements = (machines, { fiatCurrency } = {}) => {
  return [
    {
      name: 'id',
      header: 'Machine',
      width: 200,
      view: it => machines.find(({ deviceId }) => deviceId === it).name,
      size: 'sm',
      editable: false
    },
    {
      name: 'cassette1',
      header: 'Cassette 1',
      size: 'sm',
      stripe: true,
      width: 200,
      textAlign: 'right',
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      },
      suffix: fiatCurrency
    },
    {
      name: 'cassette2',
      header: 'Cassette 2',
      size: 'sm',
      stripe: true,
      textAlign: 'right',
      width: 200,
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      },
      suffix: fiatCurrency
    },
    {
      name: 'cassette3',
      header: 'Cassette 3',
      size: 'sm',
      stripe: true,
      textAlign: 'right',
      width: 200,
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      },
      suffix: fiatCurrency
    },
    {
      name: 'cassette4',
      header: 'Cassette 4',
      size: 'sm',
      stripe: true,
      textAlign: 'right',
      width: 200,
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      },
      suffix: fiatCurrency
    },
    {
      name: 'zeroConfLimit',
      header: '0-conf Limit',
      size: 'sm',
      stripe: true,
      textAlign: 'right',
      width: 200,
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      },
      suffix: fiatCurrency
    }
  ]
}

export { DenominationsSchema, getElements }
