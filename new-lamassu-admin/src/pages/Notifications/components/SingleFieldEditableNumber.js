import { Form, Formik } from 'formik'
import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import PromptWhenDirty from 'src/components/PromptWhenDirty'
import { transformNumber } from 'src/utils/number'

import Header from './EditHeader'
import EditableNumber from './EditableNumber'

const SingleFieldEditableNumber = ({
  title,
  label,
  width = 80,
  min = 0,
  max = 9999999,
  className,
  value,
  valueField,
  save,
  suffix,
  disabled
}) => {
  const [saving, setSaving] = useState(false)
  const [isEditing, setEditing] = useState(false)

  const innerSave = async value => {
    if (saving) return

    setSaving(true)

    // no response means the save failed
    await save(value)

    setSaving(false)
  }

  const schema = Yup.object().shape({
    event: Yup.string().required(),
    overrideId: Yup.string().nullable(),
    value: Yup.object().shape({
      [valueField]: Yup.number()
        .transform(transformNumber)
        .integer()
        .min(min)
        .max(max)
        .nullable()
    })
  })

  return (
    <Formik
      validateOnBlur={false}
      validateOnChange={false}
      enableReinitialize
      initialValues={value}
      validationSchema={schema}
      onSubmit={it => innerSave(schema.cast(it))}
      onReset={() => {
        setEditing(false)
      }}>
      <Form className={className}>
        <PromptWhenDirty />
        <Header
          title={title}
          editing={isEditing}
          disabled={disabled}
          setEditing={it => setEditing(it)}
        />
        <EditableNumber
          label={label}
          name={`value.${valueField}`}
          editing={isEditing}
          width={width}
          displayValue={x => (R.isEmpty(x) || R.isNil(x) ? '-' : x)}
          decoration={suffix}
        />
      </Form>
    </Formik>
  )
}

export default SingleFieldEditableNumber
