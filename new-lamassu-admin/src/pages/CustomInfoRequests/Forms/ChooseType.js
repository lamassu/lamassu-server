import { Field } from 'formik'
import React from 'react'
import * as Yup from 'yup'

import ToggleButtonGroup from 'src/components/inputs/formik/ToggleButtonGroup'
import { H4 } from 'src/components/typography'
import { ReactComponent as CustomReqLogo } from 'src/styling/icons/compliance/custom-requirement.svg'
const ChooseType = () => {
  const options = [
    {
      value: 'numerical',
      title: 'Numerical entry',
      description:
        'User will enter information with a keypad. Good for dates, ID numbers, etc.',
      icon: () => <CustomReqLogo style={{ maxWidth: 50 }} />
    },
    {
      value: 'text',
      title: 'Text entry',
      description:
        'User will entry information with a keyboard. Good for names, email, address, etc.',
      icon: () => <CustomReqLogo style={{ maxWidth: 50 }} />
    },
    {
      value: 'choiceList',
      title: 'Choice list',
      description: 'Gives user multiple options to choose from.',
      icon: () => <CustomReqLogo style={{ maxWidth: 50 }} />
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
