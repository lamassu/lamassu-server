import React from 'react'
import * as R from 'ramda'
import classnames from 'classnames'
import { makeStyles } from '@material-ui/core'
import { Formik, Form } from 'formik'

import { TL1, Info2 } from 'src/components/typography'
import commonStyles from 'src/pages/common.styles'
import {
  Table,
  TDoubleLevelHead,
  Th,
  ThDoubleLevel,
  TBody,
  Td,
  Tr,
  CellDoubleLevel
} from 'src/components/fake-table/Table'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as DisabledEditIcon } from 'src/styling/icons/action/edit/disabled.svg'
import { Link, AddButton } from 'src/components/buttons'

import {
  BigPercentageAndNumericInput,
  MultiplePercentageInput,
  Field
} from './Inputs'
import { localStyles, fiatBalanceAlertsStyles } from './Notifications.styles'
import {
  CASH_IN_FULL_KEY,
  isDisabled,
  CASH_OUT_EMPTY_KEY,
  CASSETTE_1_KEY,
  CASSETTE_2_KEY,
  PERCENTAGE_KEY,
  NUMERARY_KEY,
  OVERRIDES_KEY
} from './aux'

const styles = R.mergeAll([commonStyles, localStyles, fiatBalanceAlertsStyles])

const useStyles = makeStyles(styles)

const FiatBalanceAlerts = ({
  values: setupValues,
  save,
  editingState,
  handleEditingClick
}) => {
  const classes = useStyles()

  const getValue = R.path(R.__, setupValues)

  const handleEdit = R.curry(handleEditingClick)

  const handleSubmit = R.curry((key, it) => {
    const setup = setupValues[key]
    const pairs = R.mapObjIndexed((num, k, obj) => {
      return [R.split('-', k)[1], num]
    }, it)
    const rightKeys = R.fromPairs(R.values(pairs))
    const newItem = { [key]: R.merge(setup, rightKeys) }
    save(newItem)
  })

  const handleSubmitOverrides = R.curry((key, it) => {
    const setup = setupValues[OVERRIDES_KEY]
    const old = R.find(R.propEq('name', key), setup)
    const machineIdx = R.findIndex(R.propEq('name', key), setup)
    const pairs = R.values(
      R.mapObjIndexed((num, k, obj) => {
        const split = R.split('-', k)
        return { [split[1]]: { [split[2]]: num } }
      }, it)
    )
    const newOverride = R.mergeDeepRight(
      old,
      R.reduce(R.mergeDeepRight, {}, pairs)
    )
    const newOverrides = {
      [OVERRIDES_KEY]: R.update(machineIdx, newOverride, setup)
    }
    save(newOverrides)
  })

  const cashInFields = {
    percentage: {
      name: CASH_IN_FULL_KEY + '-' + PERCENTAGE_KEY,
      label: 'Alert me over',
      value: getValue([CASH_IN_FULL_KEY, PERCENTAGE_KEY])
    },
    numeric: {
      name: CASH_IN_FULL_KEY + '-' + NUMERARY_KEY,
      label: 'Or',
      value: getValue([CASH_IN_FULL_KEY, NUMERARY_KEY])
    }
  }

  const cashOutFields = [
    {
      title: 'Cassette 1 (Top)',
      name: CASH_OUT_EMPTY_KEY + '-' + CASSETTE_1_KEY,
      label: 'Alert me at',
      value: getValue([CASH_OUT_EMPTY_KEY, CASSETTE_1_KEY])
    },
    {
      title: 'Cassette 2',
      name: CASH_OUT_EMPTY_KEY + '-' + CASSETTE_2_KEY,
      label: 'Alert me at',
      value: getValue([CASH_OUT_EMPTY_KEY, CASSETTE_2_KEY])
    }
  ]

  const { overrides } = setupValues

  const sizes = {
    machine: 238,
    percentage: 128,
    amount: 128,
    cashOut1: 128,
    cashOut2: 128,
    edit: 98
  }

  const cashInEditing = editingState[CASH_IN_FULL_KEY]
  const cashOutEditing = editingState[CASH_OUT_EMPTY_KEY]

  return (
    <>
      <TL1 className={classes.sectionTitle}>Fiat balance alerts</TL1>
      <div>
        <div className={classnames(classes.defaults, classes.fbaDefaults)}>
          <BigPercentageAndNumericInput
            title="Cash-in (Full)"
            fields={cashInFields}
            editing={cashInEditing}
            disabled={isDisabled(editingState, CASH_IN_FULL_KEY)}
            setEditing={handleEdit(CASH_IN_FULL_KEY)}
            handleSubmit={handleSubmit(CASH_IN_FULL_KEY)}
            className={classes.cashInWrapper}
          />
          <div>
            <MultiplePercentageInput
              title="Cash-out (Empty)"
              fields={cashOutFields}
              editing={cashOutEditing}
              disabled={isDisabled(editingState, CASH_OUT_EMPTY_KEY)}
              setEditing={handleEdit(CASH_OUT_EMPTY_KEY)}
              handleSubmit={handleSubmit(CASH_OUT_EMPTY_KEY)}
            />
          </div>
        </div>
        <div className={classes.overrides}>
          <div className={classes.overridesTitle}>
            <Info2>Overrides</Info2>
          </div>
          {overrides.length === 0 && <AddButton>Add override</AddButton>}
          {overrides.length > 0 && (
            <Table>
              <TDoubleLevelHead>
                <Th size={sizes.machine}>Machine</Th>
                <ThDoubleLevel
                  title="Cash-in (Cassette Full)"
                  className={classes.doubleLevelHead}>
                  <Th size={sizes.percentage} textAlign="right">
                    Percentage
                  </Th>
                  <Th size={sizes.amount} textAlign="right">
                    Amount
                  </Th>
                </ThDoubleLevel>
                <ThDoubleLevel
                  title="Cash-out (Cassette Empty)"
                  className={classes.doubleLevelHead}>
                  <Th size={sizes.cashOut1} textAlign="right">
                    Cash-out 1
                  </Th>
                  <Th size={sizes.cashOut2} textAlign="right">
                    Cash-out 2
                  </Th>
                </ThDoubleLevel>
                <Th size={sizes.edit} textAlign="center">
                  Edit
                </Th>
              </TDoubleLevelHead>
              <TBody>
                {overrides.map((machine, idx) => {
                  const fields = {
                    percentage: {
                      name:
                        machine.name +
                        '-' +
                        CASH_IN_FULL_KEY +
                        '-' +
                        PERCENTAGE_KEY,
                      value: machine[CASH_IN_FULL_KEY][PERCENTAGE_KEY]
                    },
                    amount: {
                      name:
                        machine.name +
                        '-' +
                        CASH_IN_FULL_KEY +
                        '-' +
                        NUMERARY_KEY,
                      value: machine[CASH_IN_FULL_KEY][NUMERARY_KEY]
                    },
                    cashOut1: {
                      name:
                        machine.name +
                        '-' +
                        CASH_OUT_EMPTY_KEY +
                        '-' +
                        CASSETTE_1_KEY,
                      value: machine[CASH_OUT_EMPTY_KEY][CASSETTE_1_KEY]
                    },
                    cashOut2: {
                      name:
                        machine.name +
                        '-' +
                        CASH_OUT_EMPTY_KEY +
                        '-' +
                        CASSETTE_2_KEY,
                      value: machine[CASH_OUT_EMPTY_KEY][CASSETTE_2_KEY]
                    }
                  }

                  const initialValues = {
                    [fields.percentage.name]: fields.percentage.value,
                    [fields.amount.name]: fields.amount.value,
                    [fields.cashOut1.name]: fields.cashOut1.value,
                    [fields.cashOut2.name]: fields.cashOut2.value
                  }

                  const editing = editingState[machine.name]
                  const disabled = isDisabled(editingState, machine.name)
                  return (
                    <Formik
                      key={idx}
                      initialValues={initialValues}
                      onSubmit={values => {
                        handleSubmitOverrides(machine.name)(values)
                      }}
                      onReset={(values, bag) => {
                        handleEdit(machine.name)(false)
                      }}>
                      <Form>
                        <Tr>
                          <Td size={sizes.machine}>{machine.name}</Td>
                          <CellDoubleLevel className={classes.doubleLevelRow}>
                            <Td size={sizes.percentage} textAlign="right">
                              <Field
                                editing={editing}
                                field={fields.percentage}
                                displayValue={x => (x === '' ? '-' : x)}
                                decoration="%"
                                className={classes.eRowField}
                              />
                            </Td>
                            <Td size={sizes.amount} textAlign="right">
                              <Field
                                editing={editing}
                                field={fields.amount}
                                displayValue={x => (x === '' ? '-' : x)}
                                decoration="EUR"
                                className={classes.eRowField}
                              />
                            </Td>
                          </CellDoubleLevel>
                          <CellDoubleLevel className={classes.doubleLevelRow}>
                            <Td size={sizes.cashOut1} textAlign="right">
                              <Field
                                editing={editing}
                                field={fields.cashOut1}
                                displayValue={x => (x === '' ? '-' : x)}
                                decoration="%"
                                className={classes.eRowField}
                              />
                            </Td>
                            <Td size={sizes.cashOut2} textAlign="right">
                              <Field
                                editing={editing}
                                field={fields.cashOut2}
                                displayValue={x => (x === '' ? '-' : x)}
                                decoration="%"
                                className={classes.eRowField}
                              />
                            </Td>
                          </CellDoubleLevel>
                          <Td
                            size={sizes.edit}
                            textAlign="center"
                            className={editing && classes.edit}>
                            {!editing && !disabled && (
                              <button
                                className={classes.button}
                                onClick={() => handleEdit(machine.name)(true)}>
                                <EditIcon />
                              </button>
                            )}
                            {disabled && (
                              <div>
                                <DisabledEditIcon />
                              </div>
                            )}
                            {editing && (
                              <>
                                <Link color="primary" type="submit">
                                  Save
                                </Link>
                                <Link color="secondary" type="reset">
                                  Cancel
                                </Link>
                              </>
                            )}
                          </Td>
                        </Tr>
                      </Form>
                    </Formik>
                  )
                })}
              </TBody>
            </Table>
          )}
        </div>
      </div>
    </>
  )
}

export default FiatBalanceAlerts
