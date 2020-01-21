import React, { useState } from 'react'
import * as R from 'ramda'
import { gql } from 'apollo-boost'
import classnames from 'classnames'
import * as Yup from 'yup'
import { makeStyles } from '@material-ui/core'
import { useQuery } from '@apollo/react-hooks'

import { Info2 } from 'src/components/typography'
import commonStyles from 'src/pages/common.styles'
import { Table as EditableTable } from 'src/components/editableTable'
import Link from 'src/components/buttons/Link.js'
import { Autocomplete } from 'src/components/inputs/index.js'
import { AddButton } from 'src/components/buttons/index.js'
import TextInputFormik from 'src/components/inputs/formik/TextInput.js'

import {
  isDisabled,
  LOW_BALANCE_KEY,
  HIGH_BALANCE_KEY,
  OVERRIDES_KEY,
  ADD_OVERRIDE_CBA_KEY
} from './aux.js'
import { BigNumericInput } from './Inputs'
import { localStyles, cryptoBalanceAlertsStyles } from './Notifications.styles'

const CRYPTOCURRENCY_KEY = 'cryptocurrency'

const styles = R.mergeAll([
  commonStyles,
  localStyles,
  cryptoBalanceAlertsStyles
])

const GET_CRYPTOCURRENCIES = gql`
  {
    cryptoCurrencies {
      code
      display
    }
  }
`

const useStyles = makeStyles(styles)

const CryptoBalanceAlerts = ({
  values: setupValues,
  save,
  editingState,
  handleEditingClick,
  setError
}) => {
  const [cryptoCurrencies, setCryptoCurrencies] = useState(null)

  useQuery(GET_CRYPTOCURRENCIES, {
    onCompleted: data => {
      setCryptoCurrencies(data.cryptoCurrencies)
    },
    onError: error => console.error(error)
  })
  const classes = useStyles()

  const editingLowBalance = editingState[LOW_BALANCE_KEY]
  const editingHighBalance = editingState[HIGH_BALANCE_KEY]
  const addingOverride = editingState[ADD_OVERRIDE_CBA_KEY]

  const overrideOpsDisabled = isDisabled(editingState, ADD_OVERRIDE_CBA_KEY)

  const handleEdit = R.curry(handleEditingClick)

  const handleSubmit = it => save(it)

  const handleSubmitOverrides = it => {
    const newOverrides = {
      [OVERRIDES_KEY]: R.prepend(it, setupValues[OVERRIDES_KEY])
    }
    save(newOverrides)
  }

  const handleResetForm = () => {
    handleEdit(ADD_OVERRIDE_CBA_KEY)(false)
    setError(null)
  }

  const deleteOverride = it => {
    const cryptocurrency = it[CRYPTOCURRENCY_KEY]

    const idx = R.findIndex(
      R.propEq([CRYPTOCURRENCY_KEY], cryptocurrency),
      setupValues[OVERRIDES_KEY]
    )
    const newOverrides = R.remove(idx, 1, setupValues[OVERRIDES_KEY])

    save({ [OVERRIDES_KEY]: newOverrides })
  }

  const defaultsFields = {
    [LOW_BALANCE_KEY]: {
      name: LOW_BALANCE_KEY,
      label: 'Alert me under',
      value: setupValues[LOW_BALANCE_KEY]
    },
    [HIGH_BALANCE_KEY]: {
      name: HIGH_BALANCE_KEY,
      label: 'Alert me over',
      value: setupValues[HIGH_BALANCE_KEY]
    }
  }

  const getSuggestions = () => {
    const overridenCryptos = R.map(
      override => override[CRYPTOCURRENCY_KEY],
      setupValues[OVERRIDES_KEY]
    )
    return R.without(overridenCryptos, cryptoCurrencies ?? [])
  }

  const { [OVERRIDES_KEY]: overrides } = setupValues

  const initialValues = {
    [CRYPTOCURRENCY_KEY]: '',
    [LOW_BALANCE_KEY]: '',
    [HIGH_BALANCE_KEY]: ''
  }

  const validationSchema = Yup.object().shape({
    [CRYPTOCURRENCY_KEY]: Yup.string().required(),
    [LOW_BALANCE_KEY]: Yup.number()
      .integer()
      .min(0)
      .max(99999999)
      .required(),
    [HIGH_BALANCE_KEY]: Yup.number()
      .integer()
      .min(0)
      .max(99999999)
      .required()
  })

  const elements = [
    {
      name: CRYPTOCURRENCY_KEY,
      display: 'Cryptocurrency',
      size: 166,
      textAlign: 'left',
      view: R.path(['display']),
      type: 'text',
      input: Autocomplete,
      inputProps: {
        suggestions: getSuggestions(),
        onFocus: () => setError(null)
      }
    },
    {
      name: LOW_BALANCE_KEY,
      display: 'Low Balance',
      size: 140,
      textAlign: 'right',
      view: it => it,
      type: 'text',
      input: TextInputFormik,
      inputProps: {
        suffix: 'EUR', // TODO: Current currency?
        className: classes.textInput,
        onFocus: () => setError(null)
      }
    },
    {
      name: HIGH_BALANCE_KEY,
      display: 'High Balance',
      size: 140,
      textAlign: 'right',
      view: it => it,
      type: 'text',
      input: TextInputFormik,
      inputProps: {
        suffix: 'EUR', // TODO: Current currency?
        className: classes.textInput,
        onFocus: () => setError(null)
      }
    },
    {
      name: 'delete',
      size: 91
    }
  ]

  if (!cryptoCurrencies) return null

  return (
    <>
      <div>
        <div className={classnames(classes.defaults, classes.cbaDefaults)}>
          <BigNumericInput
            title="Default (Low Balance)"
            field={defaultsFields[LOW_BALANCE_KEY]}
            editing={editingLowBalance}
            disabled={isDisabled(editingState, LOW_BALANCE_KEY)}
            setEditing={handleEdit(LOW_BALANCE_KEY)}
            handleSubmit={handleSubmit}
            className={classes.lowBalance}
            setError={setError}
          />
          <BigNumericInput
            title="Default (High Balance)"
            field={defaultsFields[HIGH_BALANCE_KEY]}
            editing={editingHighBalance}
            disabled={isDisabled(editingState, HIGH_BALANCE_KEY)}
            setEditing={handleEdit(HIGH_BALANCE_KEY)}
            handleSubmit={handleSubmit}
            setError={setError}
          />
        </div>
      </div>
      <div className={classes.overrides}>
        <div className={classes.overridesTitle}>
          <Info2>Overrides</Info2>
          {!addingOverride && !overrideOpsDisabled && overrides.length > 0 && (
            <Link
              color="primary"
              onClick={() => handleEdit(ADD_OVERRIDE_CBA_KEY)(true)}>
              Add override
            </Link>
          )}
        </div>
        {!addingOverride && !overrideOpsDisabled && overrides.length === 0 && (
          <AddButton onClick={() => handleEdit(ADD_OVERRIDE_CBA_KEY)(true)}>
            Add overrides
          </AddButton>
        )}
        {(addingOverride || overrides.length > 0) && (
          <EditableTable
            className={classes.overridesTable}
            addingRow={addingOverride}
            disableAction={overrideOpsDisabled || addingOverride}
            editing={R.map(
              () => false,
              R.range(0, setupValues[OVERRIDES_KEY].length)
            )}
            save={handleSubmitOverrides}
            reset={handleResetForm}
            action={deleteOverride}
            initialValues={initialValues}
            validationSchema={validationSchema}
            data={setupValues[OVERRIDES_KEY]}
            elements={elements}
          />
        )}
      </div>
    </>
  )
}

export default CryptoBalanceAlerts
