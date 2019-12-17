import React, { useState, memo } from 'react'
import { Form, Formik, FastField, useFormikContext } from 'formik'

import {
  Td,
  Tr
} from '../fake-table/Table'

import { Link } from '../buttons'

const getField = (name, component, props = {}) => (
  <FastField name={name} component={component} {...props} />
)

const ERow = memo(({ elements }) => {
  const { values, submitForm, resetForm, errors } = useFormikContext()
  const [editing, setEditing] = useState(false)

  const innerSave = () => {
    submitForm()
  }

  const innerCancel = () => {
    setEditing(false)
    resetForm()
  }

  return (
    <Tr error={errors && errors.length} errorMessage={errors && errors.toString()}>
      {elements.map(({ name, input, size, textAlign, view = () => {}, inputProps }, idx) => (
        <Td key={idx} size={size} textAlign={textAlign}>
          {editing && getField(name, input, inputProps)}
          {!editing && view(values[name])}
        </Td>
      ))}
      <Td size={175}>
        {editing ? (
          <>
            <Link style={{ marginRight: '20px' }} color='secondary' onClick={innerCancel}>
              Cancel
            </Link>
            <Link color='primary' onClick={innerSave}>
              Save
            </Link>
          </>
        ) : (
          <Link color='primary' onClick={() => setEditing(true)}>
            Edit
          </Link>
        )}
      </Td>
    </Tr>
  )
})

const ERowWithFormik = memo(({ value, validationSchema, save, elements }) => {
  return (
    <Formik
      enableReinitialize
      initialValues={value}
      validationSchema={validationSchema}
      onSubmit={save}
    >
      <Form>
        <ERow elements={elements} />
      </Form>
    </Formik>
  )
})

export default ERowWithFormik
