import React, { useState } from 'react'
import * as R from 'ramda'
import { Formik, Form, Field as FormikField } from 'formik'
import { gql } from 'apollo-boost'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core'
import { useQuery } from '@apollo/react-hooks'

import { TL1, Info2, Label2 } from 'src/components/typography'
import commonStyles from 'src/pages/common.styles'
import {
  Table,
  THead,
  Th,
  TBody,
  Tr,
  Td
} from 'src/components/fake-table/Table.js'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import { ReactComponent as DisabledDeleteIcon } from 'src/styling/icons/action/delete/disabled.svg'
import Link from 'src/components/buttons/Link.js'
import { Autocomplete } from 'src/components/inputs/index.js'

import {
  isDisabled,
  LOW_BALANCE_KEY,
  HIGH_BALANCE_KEY,
  OVERRIDES_KEY,
  ADD_OVERRIDE_KEY
} from './aux.js'
import { BigNumericInput, Field } from './Inputs'
import { localStyles, cryptoBalanceAlertsStyles } from './Notifications.styles'

const CRYPTOCURRENCY_KEY = 'cryptocurrency'
const DELETE_KEY = 'delete'

const styles = R.mergeAll([
  commonStyles,
  localStyles,
  cryptoBalanceAlertsStyles
])

const overrideElements = [
  {
    header: 'Cryptocurrency',
    name: CRYPTOCURRENCY_KEY,
    size: 166,
    textAlign: 'left'
  },
  {
    header: 'Low Balance',
    name: LOW_BALANCE_KEY,
    size: 167,
    textAlign: 'left'
  },
  {
    header: 'High Balance',
    name: HIGH_BALANCE_KEY,
    size: 224,
    textAlign: 'left'
  },
  {
    header: 'Delete',
    name: DELETE_KEY,
    size: 91,
    textAlign: 'center'
  }
]

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
  handleEditingClick
}) => {
  const [cryptoCurrencies, setCryptoCurrencies] = useState(null)
  useQuery(GET_CRYPTOCURRENCIES, {
    onCompleted: data => {
      setCryptoCurrencies(data.cryptoCurrencies)
    },
    onError: error => console.log(error)
  })
  const classes = useStyles()

  const editingLowBalance = editingState[LOW_BALANCE_KEY]
  const editingHighBalance = editingState[HIGH_BALANCE_KEY]
  const addingOverride = editingState[ADD_OVERRIDE_KEY]

  const deleteDisabled = isDisabled(editingState, ADD_OVERRIDE_KEY)

  const handleEdit = R.curry(handleEditingClick)

  const handleSubmit = it => save(it)

  const handleSubmitOverrides = it => {
    const newOverrides = {
      [OVERRIDES_KEY]: R.prepend(it, setupValues[OVERRIDES_KEY])
    }
    save(newOverrides)
  }

  const deleteOverride = cryptocurrency => {
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

  const findField = name => R.find(R.propEq('name', name))(overrideElements)
  const findSize = name => findField(name).size
  const findAlign = name => findField(name).textAlign

  return (
    <>
      <TL1 className={classes.sectionTitle}>Crypto balance alerts</TL1>
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
          />
          <BigNumericInput
            title="Default (High Balance)"
            field={defaultsFields[HIGH_BALANCE_KEY]}
            editing={editingHighBalance}
            disabled={isDisabled(editingState, HIGH_BALANCE_KEY)}
            setEditing={handleEdit(HIGH_BALANCE_KEY)}
            handleSubmit={handleSubmit}
          />
        </div>
      </div>
      <div className={classes.overrides}>
        <div className={classes.overridesTitle}>
          <Info2>Overrides</Info2>
          {!addingOverride && (
            <Link
              color="primary"
              onClick={() => handleEdit(ADD_OVERRIDE_KEY)(true)}>
              Add override
            </Link>
          )}
        </div>
        <Table>
          <THead>
            {overrideElements.map(
              ({ size, className, textAlign, header }, idx) => (
                <Th
                  key={idx}
                  size={size}
                  className={className}
                  textAlign={textAlign}>
                  {header}
                </Th>
              )
            )}
          </THead>
          <TBody>
            {addingOverride && (
              <Formik
                initialValues={{
                  [CRYPTOCURRENCY_KEY]: '',
                  [LOW_BALANCE_KEY]: '',
                  [HIGH_BALANCE_KEY]: ''
                }}
                onSubmit={values => {
                  handleSubmitOverrides(values)
                }}
                onReset={(values, bag) => {
                  handleEdit(ADD_OVERRIDE_KEY)(false)
                }}>
                <Form>
                  <Tr>
                    <Td size={findSize(CRYPTOCURRENCY_KEY)}>
                      <FormikField
                        id={CRYPTOCURRENCY_KEY}
                        name={CRYPTOCURRENCY_KEY}
                        component={Autocomplete}
                        type="text"
                        suggestions={cryptoCurrencies}
                      />
                    </Td>
                    <Td size={findSize(LOW_BALANCE_KEY)}>
                      <Field
                        editing={addingOverride}
                        field={{ name: LOW_BALANCE_KEY }}
                        displayValue={x => (x === '' ? '-' : x)}
                        decoration="EUR"
                        className={classes.eRowField}
                      />
                    </Td>
                    <Td size={findSize(HIGH_BALANCE_KEY)}>
                      <Field
                        editing={addingOverride}
                        field={{ name: HIGH_BALANCE_KEY }}
                        displayValue={x => (x === '' ? '-' : x)}
                        decoration="EUR"
                        className={classes.eRowField}
                      />
                    </Td>
                    <Td size={findSize(DELETE_KEY)} className={classes.edit}>
                      <>
                        <Link color="primary" type="submit">
                          Save
                        </Link>
                        <Link color="secondary" type="reset">
                          Cancel
                        </Link>
                      </>
                    </Td>
                  </Tr>
                </Form>
              </Formik>
            )}
            {setupValues[OVERRIDES_KEY]?.map((override, idx) => (
              <Tr key={idx}>
                <Td
                  size={findSize(CRYPTOCURRENCY_KEY)}
                  textAlign={findAlign(CRYPTOCURRENCY_KEY)}>
                  {override[CRYPTOCURRENCY_KEY].display}
                </Td>
                <Td
                  size={findSize(LOW_BALANCE_KEY)}
                  textAlign={findAlign(LOW_BALANCE_KEY)}>
                  <span className={classes.displayValue}>
                    <Info2>{override[LOW_BALANCE_KEY]}</Info2>
                    <Label2>EUR</Label2>
                  </span>
                </Td>
                <Td
                  size={findSize(HIGH_BALANCE_KEY)}
                  textAlign={findAlign(HIGH_BALANCE_KEY)}>
                  <span className={classes.displayValue}>
                    <Info2>{override[HIGH_BALANCE_KEY]}</Info2>
                    <Label2>EUR</Label2>
                  </span>
                </Td>
                <Td
                  size={findSize(DELETE_KEY)}
                  textAlign={findAlign(DELETE_KEY)}>
                  <button
                    className={classes.button}
                    onClick={() =>
                      deleteOverride(override[CRYPTOCURRENCY_KEY])
                    }>
                    {!deleteDisabled && <DeleteIcon />}
                    {deleteDisabled && <DisabledDeleteIcon />}
                  </button>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  )
}

export default CryptoBalanceAlerts
