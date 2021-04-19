import ViewListIcon from '@material-ui/icons/ViewList'
import ViewModuleIcon from '@material-ui/icons/ViewModule'
import ViewQuiltIcon from '@material-ui/icons/ViewQuilt'
import ToggleButton from '@material-ui/lab/ToggleButton'
import { Field } from 'formik'
import React from 'react'
import * as Yup from 'yup'

import ToggleButtonGroup from 'src/components/inputs/formik/ToggleButtonGroup'
import { H4 } from 'src/components/typography'

const ChooseType = () => {
  const [view, setView] = React.useState('list')
  const handleChange = form => (event, nextView) => {
    form.values.dataType = view
    setView(nextView)
  }

  return (
    <>
      <H4>Choose the type of data entry</H4>
      <Field name="dataType" value="ashgdfkjasgdfkjasdkfjhg">
        {({ field, form, meta }) => {
          return (
            <ToggleButtonGroup
              name={'toggletest2'}
              orientation="vertical"
              value={view}
              exclusive
              onChange={handleChange(form)}
              field={field}>
              <ToggleButton value="list" aria-label="list">
                <ViewListIcon />
                <H4>Test</H4>
              </ToggleButton>
              <ToggleButton value="module" aria-label="module">
                <ViewModuleIcon />
              </ToggleButton>
              <ToggleButton value="quilt" aria-label="quilt">
                <ViewQuiltIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          )
        }}
      </Field>
    </>
  )
}

const validationSchema = Yup.object().shape({
  screen1Title: Yup.string().required(),
  screen1Text: Yup.string().required()
})

const defaultValues = {
  dataType: ''
}

export default ChooseType
export { validationSchema, defaultValues }
