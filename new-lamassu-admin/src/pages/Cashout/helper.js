import * as R from 'ramda'
import * as Yup from 'yup'

import { Autocomplete, NumberInput } from 'src/components/inputs/formik'
import { bold } from 'src/styling/helpers'
import denominations from 'src/utils/bill-denominations'
import { getBillOptions } from 'src/utils/bill-options'
import { CURRENCY_MAX } from 'src/utils/constants'

const DenominationsSchema = Yup.object().shape({
  top: Yup.number()
    .label('Cassette 1 (Top)')
    .required()
    .min(1)
    .max(CURRENCY_MAX),
  bottom: Yup.number()
    .label('Cassette 2 (Bottom)')
    .required()
    .min(1)
    .max(CURRENCY_MAX)
})

const getElements = (machines, locale = {}, classes) => {
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
      view: it => it,
      input: options?.length > 0 ? Autocomplete : NumberInput,
      inputProps: cassetteProps,
      suffix: R.prop('fiatCurrency')(locale),
      bold: bold
    },
    {
      name: 'bottom',
      header: 'Cassette 2 (Bottom)',
      stripe: true,
      textAlign: 'right',
      width: 250,
      view: it => it,
      input: options?.length > 0 ? Autocomplete : NumberInput,
      inputProps: cassetteProps,
      suffix: R.prop('fiatCurrency')(locale),
      bold: bold
    }
  ]
}

export { DenominationsSchema, getElements }
