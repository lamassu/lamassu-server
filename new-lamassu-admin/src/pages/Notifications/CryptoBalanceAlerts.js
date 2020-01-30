import React from 'react'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core'

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

import {
  isDisabled,
  LOW_BALANCE_KEY,
  HIGH_BALANCE_KEY,
  OVERRIDES_KEY
} from './aux.js'
import { BigNumericInput } from './Inputs'
import { localStyles, cryptoBalanceAlertsStyles } from './Notifications.styles'

const CRYPTOCURRENCY_KEY = 'name'
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

const useStyles = makeStyles(styles)

const CryptoBalanceAlerts = ({
  value: setupValues,
  save,
  editingState,
  handleEditingClick
}) => {
  const classes = useStyles()

  console.log(setupValues)

  const editingLowBalance = editingState[LOW_BALANCE_KEY]
  const editingHighBalance = editingState[HIGH_BALANCE_KEY]
  // const addingOverride = editingState[ADD_OVERRIDE_KEY]

  const handleEdit = R.curry(handleEditingClick)

  const handleSubmit = it => save(it)

  const deleteOverride = name => {
    const newOverrides = R.without(
      [R.find(R.propEq('name', name), setupValues[OVERRIDES_KEY])],
      setupValues[OVERRIDES_KEY]
    )

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
        <div className={classes.defaults}>
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
        <Info2>Overrides</Info2>
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
          {setupValues[OVERRIDES_KEY] && (
            <TBody>
              {setupValues[OVERRIDES_KEY].map((override, idx) => (
                <Tr key={idx}>
                  <Td
                    size={findSize(CRYPTOCURRENCY_KEY)}
                    textAlign={findAlign(CRYPTOCURRENCY_KEY)}>
                    {override[CRYPTOCURRENCY_KEY]}
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
                      <DeleteIcon />
                    </button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          )}
        </Table>
      </div>
    </>
  )
}

export default CryptoBalanceAlerts

// const fields = {
//   [LOW_BALANCE_KEY]: {
//     name: override.name + '-' + LOW_BALANCE_KEY,
//     value: override[LOW_BALANCE_KEY]
//   },
//   [HIGH_BALANCE_KEY]: {
//     name: override.name + '-' + HIGH_BALANCE_KEY,
//     value: override[HIGH_BALANCE_KEY]
//   }
// }

// const initialValues = {
//   [fields[LOW_BALANCE_KEY].name]: fields[LOW_BALANCE_KEY].value,
//   [fields[HIGH_BALANCE_KEY].name]:
//     fields[HIGH_BALANCE_KEY].value
// }
