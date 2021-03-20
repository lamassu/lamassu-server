import * as Yup from 'yup'

import { NumberInput } from 'src/components/inputs/formik'

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
    .max(currencyMax),
  zeroConfLimit: Yup.number()
    .label('0-conf Limit')
    .required()
    .min(0)
    .max(currencyMax)
})

const boldStyle = () => {
  return {
    fontWeight: 'bold'
  }
}

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
      stripe: true,
      width: 200,
      textAlign: 'right',
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      },
      suffix: fiatCurrency,
      textStyle: boldStyle
    },
    {
      name: 'bottom',
      header: 'Cassette 2 (Bottom)',
      stripe: true,
      textAlign: 'right',
      width: 200,
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      },
      suffix: fiatCurrency,
      textStyle: boldStyle
    },
    {
      name: 'zeroConfLimit',
      header: '0-conf Limit',
      stripe: true,
      textAlign: 'right',
      width: 200,
      input: NumberInput,
      inputProps: {
        decimalPlaces: 0
      },
      suffix: fiatCurrency,
      textStyle: boldStyle
    }
  ]
}

export { DenominationsSchema, getElements }
