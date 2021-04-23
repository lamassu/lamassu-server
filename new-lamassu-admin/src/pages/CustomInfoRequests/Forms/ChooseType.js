import { Field } from 'formik'
import React from 'react'
import * as Yup from 'yup'

import ToggleButtonGroup from 'src/components/inputs/formik/ToggleButtonGroup'
import { H4 } from 'src/components/typography'
import { ReactComponent as Keyboard } from 'src/styling/icons/compliance/keyboard.svg'
import { ReactComponent as Keypad } from 'src/styling/icons/compliance/keypad.svg'
import { ReactComponent as List } from 'src/styling/icons/compliance/list.svg'
import { zircon } from 'src/styling/variables'

const MakeIcon = IconSvg => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: zircon,
      borderRadius: 4,
      maxWidth: 104,
      maxHeight: 64,
      minWidth: 104,
      minHeight: 64
    }}>
    <IconSvg style={{ maxWidth: 80 }} />
  </div>
)

const ChooseType = () => {
  const options = [
    {
      value: 'numerical',
      title: 'Numerical entry',
      description:
        'User will enter information with a keypad. Good for dates, ID numbers, etc.',
      icon: () => MakeIcon(Keypad)
    },
    {
      value: 'text',
      title: 'Text entry',
      description:
        'User will entry information with a keyboard. Good for names, email, address, etc.',
      icon: () => MakeIcon(Keyboard)
    },
    {
      value: 'choiceList',
      title: 'Choice list',
      description: 'Gives user multiple options to choose from.',
      icon: () => MakeIcon(List)
    }
  ]

  return (
    <>
      <H4>Choose the type of data entry</H4>
      <Field
        name="inputType"
        component={ToggleButtonGroup}
        orientation="vertical"
        exclusive
        options={options}
      />
    </>
  )
}

const validationSchema = Yup.object().shape({
  inputType: Yup.string().required()
})

const defaultValues = {
  inputType: ''
}

export default ChooseType
export { validationSchema, defaultValues }
