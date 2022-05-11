import { useFormikContext } from 'formik'
import React, { useEffect } from 'react'
import { Prompt } from 'react-router-dom'

const PROMPT_DEFAULT_MESSAGE =
  'You have unsaved changes on this page. Are you sure you want to leave?'

const PromptWhenDirty = ({ message = PROMPT_DEFAULT_MESSAGE }) => {
  const formik = useFormikContext()

  const hasChanges = formik.dirty && formik.submitCount === 0

  useEffect(() => {
    if (hasChanges) {
      window.onbeforeunload = confirmExit
    } else {
      window.onbeforeunload = undefined
    }
  }, [hasChanges])

  const confirmExit = () => {
    return PROMPT_DEFAULT_MESSAGE
  }

  return <Prompt when={hasChanges} message={message} />
}

export default PromptWhenDirty
