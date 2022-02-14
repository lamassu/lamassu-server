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
  getValidationSchema: () => {
    return Yup.object().shape({
      apiKey: Yup.string('The API key must be a string')
        .max(100, 'The API key is too long')
        .required('The API key is required'),
      domain: Yup.string('The domain must be a string')
        .max(100, 'The domain is too long')
        .required('The domain is required'),
      fromEmail: Yup.string('The from email must be a string')
        .max(100, 'The from email is too long')
        .email('The from email must be a valid email address')
        .required('The from email is required'),
      toEmail: Yup.string('The to email must be a string')
        .max(100, 'The to email is too long')
        .email('The to email must be a valid email address')
        .required('The to email is required')
    })
  }
}
