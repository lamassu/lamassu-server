import { Form, Formik } from 'formik'
import React, { useContext, useState } from 'react'
import * as Yup from 'yup'

import PromptWhenDirty from 'src/components/PromptWhenDirty'

import NotificationsCtx from '../NotificationsContext'
import { transformNumber } from '../helper'

import Header from './EditHeader'
import EditableNumber from './EditableNumber'

const SingleFieldEditableNumber = ({
  title,
  label,
  width = 80,
  min = 0,
  max = 9999999,
  name,
  section,
  className
}) => {
  const [saving, setSaving] = useState(false)

  const innerSave = async (section, value) => {
    if (saving) return

    setSaving(true)

    // no response means the save failed
    await save(section, value)

    setSaving(false)
  }

  const {
    save,
    data,
    currency,
    isEditing,
    isDisabled,
    setEditing
  } = useContext(NotificationsCtx)

  const schema = Yup.object().shape({
    [name]: Yup.number()
      .transform(transformNumber)
      .integer()
      .min(min)
      .max(max)
      .nullable()
  })

  return (
    <Formik
      enableReinitialize
      initialValues={{ [name]: (data && data[name]) ?? '' }}
      validationSchema={schema}
      onSubmit={it => innerSave(section, schema.cast(it))}
      onReset={() => {
        setEditing(name, false)
      }}>
      <Form className={className}>
        <PromptWhenDirty />
        <Header
          title={title}
          editing={isEditing(name)}
          disabled={isDisabled(name)}
          setEditing={it => setEditing(name, it)}
        />
        <EditableNumber
          label={label}
          name={name}
          editing={isEditing(name)}
          width={width}
          displayValue={x => (x === '' ? '-' : x)}
          decoration={currency}
        />
      </Form>
    </Formik>
  )
}

export default SingleFieldEditableNumber
