import * as Yup from 'yup'

import Autocomplete from 'src/components/inputs/formik/Autocomplete.js'
import { getView, requirementOptions } from 'src/pages/Triggers/helper'

const defaultSchema = Yup.object().shape({
  expirationTime: Yup.string()
    .label('Expiration time')
    .required(),
  automation: Yup.string()
    .label('Automation')
    .matches(/(Manual|Automatic)/)
    .required()
})

const overridesSchema = Yup.object().shape({
  id: Yup.string()
    .label('Requirement')
    .required(),
  expirationTime: Yup.string()
    .label('Expiration time')
    .required(),
  automation: Yup.string()
    .label('Automation')
    .matches(/(Manual|Automatic)/)
    .required()
})

const getDefaultSettings = () => {
  return [
    {
      name: 'expirationTime',
      header: 'Expiration Time',
      width: 196,
      size: 'sm',
      editable: false
    },
    {
      name: 'automation',
      header: 'Automation',
      width: 196,
      size: 'sm',
      input: Autocomplete,
      inputProps: {
        options: [
          { code: 'Automatic', display: 'Automatic' },
          { code: 'Manual', display: 'Manual' }
        ],
        labelProp: 'display',
        valueProp: 'code'
      }
    }
  ]
}

const getOverrides = () => {
  return [
    {
      name: 'requirement',
      header: 'Requirement',
      width: 196,
      size: 'sm',
      view: getView(requirementOptions, 'display'),
      input: Autocomplete,
      inputProps: {
        options: requirementOptions,
        labelProp: 'display',
        valueProp: 'code'
      }
    },
    {
      name: 'expirationTime',
      header: 'Expiration Time',
      width: 196,
      size: 'sm',
      editable: false
    },
    {
      name: 'automation',
      header: 'Automation',
      width: 196,
      size: 'sm',
      input: Autocomplete,
      inputProps: {
        options: [
          { code: 'Automatic', display: 'Automatic' },
          { code: 'Manual', display: 'Manual' }
        ],
        labelProp: 'display',
        valueProp: 'code'
      }
    }
  ]
}

const defaults = [
  {
    expirationTime: 'Forever',
    automation: 'Automatic'
  }
]

const overridesDefaults = {
  requirement: '',
  expirationTime: 'Forever',
  automation: 'Automatic'
}

export {
  defaultSchema,
  overridesSchema,
  defaults,
  overridesDefaults,
  getDefaultSettings,
  getOverrides
}
