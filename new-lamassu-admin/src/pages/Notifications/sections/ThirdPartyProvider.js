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
    sms: Yup.string('The ticker must be a string').required(
      'The ticker is required'
    )
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
    }
  ]

  return (
    <EditableTable
      name="thirdParty"
      initialValues={data?.thirdParty ?? { sms: 'twilio' }}
      data={R.of(data || [])}
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
