import * as R from 'ramda'
import React, { useContext } from 'react'
import * as Yup from 'yup'

import { Table as EditableTable } from 'src/components/editableTable'
import Autocomplete from 'src/components/inputs/formik/Autocomplete'
import TextInputFormik from 'src/components/inputs/formik/TextInput.js'

import NotificationsCtx from '../NotificationsContext'

const CASSETTE_1_KEY = 'cassette1'
const CASSETTE_2_KEY = 'cassette2'
const MACHINE_KEY = 'machine'
const NAME = 'fiatBalanceOverrides'

const FiatBalanceOverrides = ({ section }) => {
  const { machines, data, save, isDisabled, setEditing } = useContext(
    NotificationsCtx
  )

  const setupValues = data?.fiatBalanceOverrides ?? []
  const innerSetEditing = it => setEditing(NAME, it)

  const getSuggestions = () => {
    const overridenMachines = R.map(override => override.machine, setupValues)
    return R.without(overridenMachines, machines ?? [])
  }

  const initialValues = {
    [MACHINE_KEY]: null,
    [CASSETTE_1_KEY]: '',
    [CASSETTE_2_KEY]: ''
  }

  const validationSchema = Yup.object().shape({
    [MACHINE_KEY]: Yup.string().required(),
    [CASSETTE_1_KEY]: Yup.number()
      .integer()
      .min(0)
      .required(),
    [CASSETTE_2_KEY]: Yup.number()
      .integer()
      .min(0)
      .required()
  })

  const suggestions = getSuggestions()

  const elements = [
    {
      name: MACHINE_KEY,
      width: 238,
      size: 'sm',
      view: R.path(['name']),
      input: Autocomplete,
      inputProps: {
        options: suggestions,
        limit: null,
        forceShowValue: true,
        getOptionSelected: R.eqProps('display')
      }
    },
    {
      name: CASSETTE_1_KEY,
      display: 'Cash-out 1',
      width: 155,
      textAlign: 'right',
      bold: true,
      input: TextInputFormik,
      suffix: 'notes'
    },
    {
      name: CASSETTE_2_KEY,
      display: 'Cash-out 2',
      width: 155,
      textAlign: 'right',
      bold: true,
      input: TextInputFormik,
      suffix: 'notes'
    }
  ]

  return (
    <EditableTable
      name={NAME}
      title="Overrides"
      enableDelete
      enableEdit
      enableCreate
      save={it => save(section, it)}
      initialValues={initialValues}
      validationSchema={validationSchema}
      forceDisable={isDisabled(NAME) || !machines}
      data={setupValues}
      elements={elements}
      disableAdd={!suggestions?.length}
      setEditing={innerSetEditing}
    />
  )
}

export default FiatBalanceOverrides
