import React from 'react'
import { Prompt as ReactRouterPrompt } from 'react-router-dom'

const PROMPT_DEFAULT_MESSAGE =
  'You have unsaved changes on this page. Are you sure you want to leave?'

const Prompt = ({ when, message = PROMPT_DEFAULT_MESSAGE }) => (
  <ReactRouterPrompt when={when} message={message} />
)

export default Prompt
