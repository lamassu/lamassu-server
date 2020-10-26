import * as Yup from 'yup'

import TextInputFormik from 'src/components/inputs/formik/TextInput'

export default {
  code: 'mailgun',
  name: 'Mailgun',
  title: 'Mailgun (Email)',
  elements: [
    {
      code: 'apiKey',
      display: 'API Key',
      component: TextInputFormik
    },
    {
      code: 'domain',
      display: 'Domain',
      component: TextInputFormik
    },
    {
      code: 'fromEmail',
      display: 'From Email',
      component: TextInputFormik,
      face: true
    },
    {
      code: 'toEmail',
      display: 'To Email',
      component: TextInputFormik,
      face: true
    }
  ],
  validationSchema: Yup.object().shape({
    apiKey: Yup.string()
      .max(100, 'Too long')
      .required(),
    domain: Yup.string()
      .max(100, 'Too long')
      .required(),
    fromEmail: Yup.string()
      .max(100, 'Too long')
      .email('Please input a valid email address')
      .required(),
    toEmail: Yup.string()
      .max(100, 'Too long')
      .email('Please input a valid email address')
      .required()
  })
}
