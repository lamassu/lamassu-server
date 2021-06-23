import * as R from 'ramda'
import * as Yup from 'yup'

import Autocomplete from 'src/components/inputs/formik/Autocomplete.js'
import { getView } from 'src/pages/Triggers/helper'

const advancedRequirementOptions = [
  { display: 'SMS verification', code: 'sms' },
  { display: 'ID card image', code: 'idCardPhoto' },
  { display: 'ID data', code: 'idCardData' },
  { display: 'Customer camera', code: 'facephoto' },
  { display: 'US SSN', code: 'usSsn' }
]

const alreadyExists = (values, requirement) => {
  return R.isEmpty(R.filter(value => value.requirement === requirement)(values))
}

const displayRequirement = code => {
  return R.prop(
    'display',
    R.find(R.propEq('code', code))(advancedRequirementOptions)
  )
}

const defaultSchema = Yup.object().shape({
  expirationTime: Yup.string()
    .label('Expiration time')
    .required(),
  automation: Yup.string()
    .label('Automation')
    .matches(/(Manual|Automatic)/)
    .required()
})

const getOverridesSchema = values => {
  return Yup.object().shape({
    id: Yup.string()
      .label('Requirement')
      .required()
      .test({
        test() {
          const { requirement } = this.parent
          if (!alreadyExists(values, requirement)) {
            return this.createError({
              message: `Requirement ${displayRequirement(
                requirement
              )} already overriden`
            })
          }
          return true
        }
      }),
    expirationTime: Yup.string()
      .label('Expiration time')
      .required(),
    automation: Yup.string()
      .label('Automation')
      .matches(/(Manual|Automatic)/)
      .required()
  })
}

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
      view: getView(advancedRequirementOptions, 'display'),
      input: Autocomplete,
      inputProps: {
        options: advancedRequirementOptions,
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
  getOverridesSchema,
  defaults,
  overridesDefaults,
  getDefaultSettings,
  getOverrides
}
