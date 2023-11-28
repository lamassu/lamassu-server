import * as R from 'ramda'
import React, { useContext } from 'react'
import * as Yup from 'yup'

import { Table as EditableTable } from 'src/components/editableTable'
import Autocomplete from 'src/components/inputs/formik/Autocomplete'
import { toNamespace, fromNamespace } from 'src/utils/config'

import NotificationsCtx from '../NotificationsContext'

const filterClass = type => R.filter(it => it.class === type)

const ThirdPartyProvider = () => {
  const { save, data: _data, error, accountsConfig } = useContext(
    NotificationsCtx
  )

  const data = fromNamespace('thirdParty')(_data)

  const filterOptions = type => filterClass(type)(accountsConfig || [])

  const getDisplayName = type => it =>
    R.compose(
      R.prop('display'),
      R.find(R.propEq('code', it))
    )(filterOptions(type))

  const innerSave = async value => {
    const config = toNamespace('thirdParty')(value?.thirdParty[0])
    await save('thirdParty', config)
  }

  const ThirdPartySchema = Yup.object().shape({
    sms: Yup.string('SMS must be a string').required('SMS is required'),
    email: Yup.string('Email must be a string').required('Email is required')
  })

  const elements = [
    {
      name: 'sms',
      size: 'sm',
      view: getDisplayName('sms'),
      width: 175,
      input: Autocomplete,
      inputProps: {
        options: filterOptions('sms'),
        valueProp: 'code',
        labelProp: 'display'
      }
    },
    {
      name: 'email',
      size: 'sm',
      view: getDisplayName('email'),
      width: 175,
      input: Autocomplete,
      inputProps: {
        options: filterOptions('email'),
        valueProp: 'code',
        labelProp: 'display'
      }
    }
  ]
  const values = {
    sms: data.sms ?? 'twilio',
    email: data.email ?? 'mailgun'
  }

  return (
    <EditableTable
      name="thirdParty"
      initialValues={values}
      data={R.of(values)}
      error={error?.message}
      enableEdit
      editWidth={174}
      save={innerSave}
      validationSchema={ThirdPartySchema}
      elements={elements}
    />
  )
}

export default ThirdPartyProvider
