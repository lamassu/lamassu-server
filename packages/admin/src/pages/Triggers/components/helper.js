import * as R from 'ramda'
import * as Yup from 'yup'

import Autocomplete from 'src/components/inputs/formik/Autocomplete.js'
import { getView } from 'src/pages/Triggers/helper'

const buildAdvancedRequirementOptions = customInfoRequests => {
  const base = [
    { display: 'Sanctions', code: 'sanctions' },
    { display: 'ID card image', code: 'idCardPhoto' },
    { display: 'ID data', code: 'idCardData' },
    { display: 'Customer camera', code: 'facephoto' },
    { display: 'US SSN', code: 'usSsn' }
  ]

  const custom = R.map(it => ({
    display: it.customRequest.name,
    code: it.id
  }))(customInfoRequests)

  return R.concat(base, custom)
}

const displayRequirement = (code, customInfoRequests) => {
  return R.prop(
    'display',
    R.find(R.propEq('code', code))(
      buildAdvancedRequirementOptions(customInfoRequests)
    )
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

const getOverridesSchema = (values, customInfoRequests) => {
  return Yup.object().shape({
    id: Yup.string()
      .label('Requirement')
      .required()
      .test({
        test() {
          const { requirement } = this.parent
          if (R.find(R.propEq('requirement', requirement))(values)) {
            return this.createError({
              message: `Requirement ${displayRequirement(
                requirement,
                customInfoRequests
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
      header: 'Expiration time',
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

const getOverrides = customInfoRequests => {
  return [
    {
      name: 'requirement',
      header: 'Requirement',
      width: 196,
      size: 'sm',
      view: getView(
        buildAdvancedRequirementOptions(customInfoRequests),
        'display'
      ),
      input: Autocomplete,
      inputProps: {
        options: buildAdvancedRequirementOptions(customInfoRequests),
        labelProp: 'display',
        valueProp: 'code'
      }
    },
    {
      name: 'expirationTime',
      header: 'Expiration time',
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
