import { useFormikContext } from 'formik'
import React from 'react'
import { Prompt } from 'react-router-dom'

const PROMPT_DEFAULT_MESSAGE =
  'You have unsaved changes on this page. Are you sure you want to leave?'

const PromptWhenDirty = ({ message = PROMPT_DEFAULT_MESSAGE }) => {
  const formik = useFormikContext()

  return (
    <Prompt when={formik.dirty && formik.submitCount === 0} message={message} />
  )
}

export default PromptWhenDirty
