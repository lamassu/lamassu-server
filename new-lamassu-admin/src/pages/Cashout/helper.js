import * as Yup from 'yup'

import { NumberInput } from 'src/components/inputs/formik'

const currencyMax = 999999999
const DenominationsSchema = Yup.object().shape({
  top: Yup.number()
    .required('Required')
    .min(0)
    .max(currencyMax),
  bottom: Yup.number()
    .required('Required')
    .min(0)
    .max(currencyMax),
  zeroConfLimit: Yup.number()
    .required('Required')
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
      name: 'top',
      header: 'Cassette 1 (Top)',
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
      name: 'bottom',
      header: 'Cassette 2 (Bottom)',
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
