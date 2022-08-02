import * as Yup from 'yup'

import {
  Autocomplete,
  NumberInput,
  TextInput
} from 'src/components/inputs/formik'

export default {
  code: 'electrum',
  name: 'Electrum',
  title: 'Electrum (Wallet)',

  elements: [
    {
      code: 'host',
      display: 'Hostname',
      component: TextInput,
      face: true
    },
    {
      code: 'port',
      display: 'Port number',
      component: NumberInput,
      face: true
    },
    {
      code: 'protocol',
      display: 'Protocol',
      component: Autocomplete,
      inputProps: {
        labelProp: 'title',
        valueProp: 'value',
        options: [
          { value: 'tcp', title: 'TCP' },
          { value: 'ssl', title: 'SSL' }
        ]
      }
    },
    {
      code: 'network',
      display: 'Crypto network',
      component: Autocomplete,
      inputProps: {
        labelProp: 'title',
        valueProp: 'value',
        options: [
          { value: 'main', title: 'Mainnet' },
          { value: 'test', title: 'Testnet' },
          { value: 'regtest', title: 'Regtest' }
        ]
      }
    }
  ],

  getValidationSchema: account => {
    return Yup.object().shape({
      host: Yup.string('The hostname must be a string').required(
        'The project ID is required'
      ),
      port: Yup.string('The port must be a number').required(
        'The port is required'
      ),
      protocol: Yup.string('The protocol must be a string')
        .oneOf(['tcp', 'ssl'])
        .required('The protocol is required'),
      network: Yup.string('The network must be a string')
        .oneOf(['main', 'test', 'regtest'])
        .required('The network is required')
    })
  }
}
