import React, { useState } from 'react'
import * as R from 'ramda'
import classnames from 'classnames'
import { gql } from 'apollo-boost'
import * as Yup from 'yup'
import { makeStyles } from '@material-ui/core'
import { useQuery } from '@apollo/react-hooks'

import { Info2 } from 'src/components/typography'
import commonStyles from 'src/pages/common.styles'
import { Table as EditableTable } from 'src/components/editableTable'
import { Link, AddButton } from 'src/components/buttons'
import { Autocomplete } from 'src/components/inputs'
import TextInputFormik from 'src/components/inputs/formik/TextInput.js'

import { BigPercentageAndNumericInput, MultiplePercentageInput } from './Inputs'
import { localStyles, fiatBalanceAlertsStyles } from './Notifications.styles'
import {
  CASH_IN_FULL_KEY,
  isDisabled,
  CASH_OUT_EMPTY_KEY,
  CASSETTE_1_KEY,
  CASSETTE_2_KEY,
  PERCENTAGE_KEY,
  NUMERARY_KEY,
  OVERRIDES_KEY,
  ADD_OVERRIDE_FBA_KEY,
  MACHINE_KEY
} from './aux'

const styles = R.mergeAll([commonStyles, localStyles, fiatBalanceAlertsStyles])

const useStyles = makeStyles(styles)

const GET_MACHINES = gql`
  {
    machines {
      name
      deviceId
    }
  }
`

// const OverridesRow = ({
//   machine,
//   handleSubmitOverrides,
//   handleEdit,
//   setError,
//   sizes,
//   editing,
//   fields,
//   disabled,
//   getSuggestions,
//   ...props
// }) => {
//   const classes = useStyles()

//   const baseInitialValues = {
//     [fields[PERCENTAGE_KEY].name]: fields[PERCENTAGE_KEY].value ?? '',
//     [fields[NUMERARY_KEY].name]: fields[NUMERARY_KEY].value ?? '',
//     [fields[CASSETTE_1_KEY].name]: fields[CASSETTE_1_KEY].value ?? '',
//     [fields[CASSETTE_2_KEY].name]: fields[CASSETTE_2_KEY].value ?? ''
//   }

//   const initialValues = machine
//     ? baseInitialValues
//     : R.assoc(fields[MACHINE_KEY].name, '', baseInitialValues)

//   const baseValidationSchemaShape = {
//     [fields[PERCENTAGE_KEY].name]: Yup.number()
//       .integer()
//       .min(0)
//       .max(100)
//       .required(),
//     [fields[NUMERARY_KEY].name]: Yup.number()
//       .integer()
//       .min(0)
//       .max(99999999)
//       .required(),
//     [fields[CASSETTE_1_KEY].name]: Yup.number()
//       .integer()
//       .min(0)
//       .max(100)
//       .required(),
//     [fields[CASSETTE_2_KEY].name]: Yup.number()
//       .integer()
//       .min(0)
//       .max(100)
//       .required()
//   }

//   const validationSchemaShape = machine
//     ? baseValidationSchemaShape
//     : R.assoc(
//         fields[MACHINE_KEY].name,
//         Yup.string().required(),
//         baseValidationSchemaShape
//       )

//   return (
//     <Formik
//       initialValues={initialValues}
//       validationSchema={Yup.object().shape(validationSchemaShape)}
//       onSubmit={values => {
//         const machineName = machine
//           ? machine.name
//           : values[fields[MACHINE_KEY].name].name
//         handleSubmitOverrides(machineName)(values)
//       }}
//       onReset={(values, bag) => {
//         handleEdit(machine?.name ?? ADD_OVERRIDE_FBA_KEY)(false)
//         setError(null)
//       }}>
//       <Form>
//         <Tr>
//           <Td size={sizes.machine}>
//             {machine && machine.name}
//             {!machine && (
//               <FormikField
//                 id={fields[MACHINE_KEY].name}
//                 name={fields[MACHINE_KEY].name}
//                 component={Autocomplete}
//                 type="text"
//                 suggestions={getSuggestions()}
//                 code="deviceId"
//                 display="name"
//               />
//             )}
//           </Td>
//           <CellDoubleLevel className={classes.doubleLevelRow}>
//             <Td size={sizes.percentage} textAlign="right">
//               <Field
//                 editing={editing}
//                 field={fields[PERCENTAGE_KEY]}
//                 displayValue={x => (x === '' ? '-' : x)}
//                 decoration="%"
//                 className={classes.eRowField}
//                 setError={setError}
//               />
//             </Td>
//             <Td size={sizes.amount} textAlign="right">
//               <Field
//                 editing={editing}
//                 field={fields[NUMERARY_KEY]}
//                 displayValue={x => (x === '' ? '-' : x)}
//                 decoration="EUR"
//                 className={classes.eRowField}
//                 setError={setError}
//               />
//             </Td>
//           </CellDoubleLevel>
//           <CellDoubleLevel className={classes.doubleLevelRow}>
//             <Td size={sizes.cashOut1} textAlign="right">
//               <Field
//                 editing={editing}
//                 field={fields[CASSETTE_1_KEY]}
//                 displayValue={x => (x === '' ? '-' : x)}
//                 decoration="%"
//                 className={classes.eRowField}
//                 setError={setError}
//               />
//             </Td>
//             <Td size={sizes.cashOut2} textAlign="right">
//               <Field
//                 editing={editing}
//                 field={fields[CASSETTE_2_KEY]}
//                 displayValue={x => (x === '' ? '-' : x)}
//                 decoration="%"
//                 className={classes.eRowField}
//                 setError={setError}
//               />
//             </Td>
//           </CellDoubleLevel>
//           <Td
//             size={sizes.edit}
//             textAlign="center"
//             className={editing && classes.edit}>
//             {!editing && !disabled && (
//               <button
//                 className={classes.button}
//                 onClick={() => handleEdit(machine.name)(true)}>
//                 <EditIcon />
//               </button>
//             )}
//             {disabled && (
//               <div>
//                 <DisabledEditIcon />
//               </div>
//             )}
//             {editing && (
//               <>
//                 <Link color="primary" type="submit">
//                   Save
//                 </Link>
//                 <Link color="secondary" type="reset">
//                   Cancel
//                 </Link>
//               </>
//             )}
//           </Td>
//         </Tr>
//       </Form>
//     </Formik>
//   )
// }

const FiatBalanceAlerts = ({
  values: setupValues,
  save,
  editingState,
  handleEditingClick,
  setError
}) => {
  const [machines, setMachines] = useState(null)
  useQuery(GET_MACHINES, {
    onCompleted: data => {
      setMachines(data.machines)
    },
    onError: error => console.error(error)
  })

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
    const pathMatches = R.pathEq(['machine', 'name'], key)

    const pairs = R.values(
      R.mapObjIndexed((num, k, obj) => {
        const split = R.split('-', k)
        if (split.length < 3) return { [split[1]]: num }
        return { [split[1]]: { [split[2]]: num } }
      }, it)
    )

    const old = R.find(pathMatches, setup)
    if (!old) {
      const newOverride = R.reduce(R.mergeDeepRight, {}, pairs)
      const newOverrides = {
        [OVERRIDES_KEY]: R.prepend(newOverride, setup)
      }
      save(newOverrides)
      return
    }

    const machineIdx = R.findIndex(pathMatches, setup)
    const newOverride = R.mergeDeepRight(
      old,
      R.reduce(R.mergeDeepRight, {}, pairs)
    )
    const newOverrides = {
      [OVERRIDES_KEY]: R.update(machineIdx, newOverride, setup)
    }
    save(newOverrides)
  })

  const handleResetForm = it => {
    const machine = it?.machine
    handleEdit(machine?.name ?? ADD_OVERRIDE_FBA_KEY)(false)
    setError(null)
  }

  const getSuggestions = () => {
    const overridenMachines = R.map(
      override => override.machine,
      setupValues[OVERRIDES_KEY]
    )
    return R.without(overridenMachines, machines ?? [])
  }

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

  const initialValues = {
    [MACHINE_KEY]: '',
    [PERCENTAGE_KEY]: '',
    [NUMERARY_KEY]: '',
    [CASSETTE_1_KEY]: '',
    [CASSETTE_2_KEY]: ''
  }

  const validationSchema = Yup.object().shape({
    [MACHINE_KEY]: Yup.string().required(),
    [PERCENTAGE_KEY]: Yup.number()
      .integer()
      .min(0)
      .max(100)
      .required(),
    [NUMERARY_KEY]: Yup.number()
      .integer()
      .min(0)
      .max(99999999)
      .required(),
    [CASSETTE_1_KEY]: Yup.number()
      .integer()
      .min(0)
      .max(100)
      .required(),
    [CASSETTE_2_KEY]: Yup.number()
      .integer()
      .min(0)
      .max(100)
      .required()
  })

  const elements = [
    {
      name: MACHINE_KEY,
      display: 'Machine',
      size: 238,
      textAlign: 'left',
      view: R.path(['display']),
      type: 'text',
      input: Autocomplete,
      inputProps: {
        suggestions: getSuggestions(),
        onFocus: () => setError(null)
      }
    },
    [
      { display: 'Cash-in (Cassette Full)' },
      {
        name: PERCENTAGE_KEY,
        display: 'Percentage',
        size: 128,
        textAlign: 'right',
        view: it => it,
        type: 'text',
        input: TextInputFormik,
        inputProps: {
          suffix: '%',
          className: classes.textInput,
          onFocus: () => setError(null)
        }
      },
      {
        name: NUMERARY_KEY,
        display: 'Amount',
        size: 128,
        textAlign: 'right',
        view: it => it,
        type: 'text',
        input: TextInputFormik,
        inputProps: {
          suffix: 'EUR', // TODO: Current currency?
          className: classes.textInput,
          onFocus: () => setError(null)
        }
      }
    ],
    [
      { display: 'Cash-out (Cassette Empty)' },
      {
        name: CASSETTE_1_KEY,
        display: 'Cash-out 1',
        size: 128,
        textAlign: 'right',
        view: it => it,
        type: 'text',
        input: TextInputFormik,
        inputProps: {
          suffix: '%',
          className: classes.textInput,
          onFocus: () => setError(null)
        }
      },
      {
        name: CASSETTE_2_KEY,
        display: 'Cash-out 2',
        size: 128,
        textAlign: 'right',
        view: it => it,
        type: 'text',
        input: TextInputFormik,
        inputProps: {
          suffix: '%',
          className: classes.textInput,
          onFocus: () => setError(null)
        }
      }
    ],
    {
      name: 'edit',
      size: 98
    }
  ]

  const cashInEditing = editingState[CASH_IN_FULL_KEY]
  const cashOutEditing = editingState[CASH_OUT_EMPTY_KEY]
  const overrideOpsDisabled = isDisabled(editingState, ADD_OVERRIDE_FBA_KEY)
  const addingOverride = editingState[ADD_OVERRIDE_FBA_KEY]

  if (!machines) return null

  return (
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
          setError={setError}
        />
        <div>
          <MultiplePercentageInput
            title="Cash-out (Empty)"
            fields={cashOutFields}
            editing={cashOutEditing}
            disabled={isDisabled(editingState, CASH_OUT_EMPTY_KEY)}
            setEditing={handleEdit(CASH_OUT_EMPTY_KEY)}
            handleSubmit={handleSubmit(CASH_OUT_EMPTY_KEY)}
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
              onClick={() => handleEdit(ADD_OVERRIDE_FBA_KEY)(true)}>
              Add override
            </Link>
          )}
        </div>
        {!addingOverride && !overrideOpsDisabled && overrides.length === 0 && (
          <AddButton onClick={() => handleEdit(ADD_OVERRIDE_FBA_KEY)(true)}>
            Add overrides
          </AddButton>
        )}
        {(addingOverride || overrides.length > 0) && (
          <EditableTable
            className={{ head: { cell: classes.doubleLevelHead } }}
            addingRow={addingOverride}
            disableAction={overrideOpsDisabled || addingOverride}
            editing={R.map(
              () => false,
              R.range(0, setupValues[OVERRIDES_KEY].length)
            )}
            save={handleSubmitOverrides}
            reset={() => handleResetForm}
            action={it => handleEdit(it.machine.name)(true)}
            initialValues={initialValues}
            validationSchema={validationSchema}
            // data={setupValues[OVERRIDES_KEY]}
            data={[]}
            elements={elements}
            double
          />
          // <Table>
          //   <TDoubleLevelHead>
          //     <Th size={sizes.machine}>Machine</Th>
          //     <ThDoubleLevel
          //       title="Cash-in (Cassette Full)"
          //       className={classes.doubleLevelHead}>
          //       <Th size={sizes.percentage} textAlign="right">
          //         Percentage
          //       </Th>
          //       <Th size={sizes.amount} textAlign="right">
          //         Amount
          //       </Th>
          //     </ThDoubleLevel>
          //     <ThDoubleLevel
          //       title="Cash-out (Cassette Empty)"
          //       className={classes.doubleLevelHead}>
          //       <Th size={sizes.cashOut1} textAlign="right">
          //         Cash-out 1
          //       </Th>
          //       <Th size={sizes.cashOut2} textAlign="right">
          //         Cash-out 2
          //       </Th>
          //     </ThDoubleLevel>
          //     <Th size={sizes.edit} textAlign="center">
          //       Edit
          //     </Th>
          //   </TDoubleLevelHead>
          //   <TBody>
          //     {addingOverride && (
          //       <OverridesRow
          //         handleSubmitOverrides={handleSubmitOverrides}
          //         handleEdit={handleEdit}
          //         sizes={sizes}
          //         editing={editingState[ADD_OVERRIDE_FBA_KEY]}
          //         fields={{
          //           [MACHINE_KEY]: { name: `new-${MACHINE_KEY}` },
          //           [PERCENTAGE_KEY]: {
          //             name: `new-${CASH_IN_FULL_KEY}-${PERCENTAGE_KEY}`
          //           },
          //           [NUMERARY_KEY]: {
          //             name: `new-${CASH_IN_FULL_KEY}-${NUMERARY_KEY}`
          //           },
          //           [CASSETTE_1_KEY]: {
          //             name: `new-${CASH_OUT_EMPTY_KEY}-${CASSETTE_1_KEY}`
          //           },
          //           [CASSETTE_2_KEY]: {
          //             name: `new-${CASH_OUT_EMPTY_KEY}-${CASSETTE_2_KEY}`
          //           }
          //         }}
          //         disabled={isDisabled(ADD_OVERRIDE_FBA_KEY)}
          //         getSuggestions={getSuggestions}
          //         setError={setError}
          //       />
          //     )}
          //     {overrides.map((override, idx) => {
          //       const machine = override[MACHINE_KEY]

          //       const fields = {
          //         [PERCENTAGE_KEY]: {
          //           name: `${machine.name}-${CASH_IN_FULL_KEY}-${PERCENTAGE_KEY}`,
          //           value: override[CASH_IN_FULL_KEY][PERCENTAGE_KEY]
          //         },
          //         [NUMERARY_KEY]: {
          //           name: `${machine.name}-${CASH_IN_FULL_KEY}-${NUMERARY_KEY}`,
          //           value: override[CASH_IN_FULL_KEY][NUMERARY_KEY]
          //         },
          //         [CASSETTE_1_KEY]: {
          //           name: `${machine.name}-${CASH_OUT_EMPTY_KEY}-${CASSETTE_1_KEY}`,
          //           value: override[CASH_OUT_EMPTY_KEY][CASSETTE_1_KEY]
          //         },
          //         [CASSETTE_2_KEY]: {
          //           name: `${machine.name}-${CASH_OUT_EMPTY_KEY}-${CASSETTE_2_KEY}`,
          //           value: override[CASH_OUT_EMPTY_KEY][CASSETTE_2_KEY]
          //         }
          //       }

          //       const editing = editingState[machine.name]
          //       const disabled = isDisabled(editingState, machine.name)

          //       return (
          //         <OverridesRow
          //           key={idx}
          //           machine={machine}
          //           handleSubmitOverrides={handleSubmitOverrides}
          //           handleEdit={handleEdit}
          //           sizes={sizes}
          //           editing={editing}
          //           fields={fields}
          //           disabled={disabled}
          //           setError={setError}
          //         />
          //       )
          //     })}
          //   </TBody>
          // </Table>
        )}
      </div>
    </div>
  )
}

export default FiatBalanceAlerts
