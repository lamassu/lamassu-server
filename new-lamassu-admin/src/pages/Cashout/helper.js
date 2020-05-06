import * as Yup from 'yup'

import TextInput from 'src/components/inputs/formik/TextInput'

const DenominationsSchema = Yup.object().shape({
  top: Yup.number().required('Required'),
  bottom: Yup.number().required('Required'),
  zeroConfLimit: Yup.number().required('Required')
})

const getElements = (machines, { fiatCurrency } = {}) => {
  return [
    {
      name: 'id',
      header: 'Machine',
      width: 254,
      view: it => machines.find(({ deviceId }) => deviceId === it).name,
      size: 'sm',
      editable: false
    },
    {
      name: 'top',
      header: 'Cassette 1 (Top)',
      view: it => `${it} ${fiatCurrency}`,
      size: 'sm',
      stripe: true,
      width: 265,
      input: TextInput
    },
    {
      name: 'bottom',
      header: 'Cassette 2 (Bottom)',
      view: it => `${it} ${fiatCurrency}`,
      size: 'sm',
      stripe: true,
      width: 265,
      input: TextInput
    },
    {
      name: 'zeroConfLimit',
      header: '0-conf Limit',
      size: 'sm',
      stripe: true,
      width: 200,
      input: TextInput
    }
  ]
}

export { DenominationsSchema, getElements }
