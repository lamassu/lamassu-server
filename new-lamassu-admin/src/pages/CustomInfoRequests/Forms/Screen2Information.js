import { makeStyles } from '@material-ui/core/styles'
import { Field } from 'formik'
import React from 'react'
import * as Yup from 'yup'

import { Tooltip } from 'src/components/Tooltip'
import TextInputFormik from 'src/components/inputs/formik/TextInput'
import { H4, P } from 'src/components/typography'
const styles = {
  flex: {
    display: 'flex',
    alignItems: 'center'
  }
}

const useStyles = makeStyles(styles)
const ScreenInformation = () => {
  const classes = useStyles()

  return (
    <>
      <div className={classes.flex}>
        <H4>Screen 2 Information</H4>
        <Tooltip width={304}>
          <P>
            Upon agreeing to provide the information you are requiring,
            depending on the entry type you selected, users will be requested to
            enter that same information on a second screen. The title you choose
            for this screen would ideally briefly describe what the screen is
            for, to keep users situated on the process.
          </P>
        </Tooltip>
      </div>
      <P>
        If the user agrees, on screen 2 is where the user will enter the custom
        information.
      </P>
      <Field
        component={TextInputFormik}
        label="Screen 2 input title"
        name="screen2Title"
        fullWidth
      />
      <Field
        component={TextInputFormik}
        label="Screen 2 input description"
        name="screen2Text"
        fullWidth
      />
    </>
  )
}

const validationSchema = Yup.object().shape({
  screen2Title: Yup.string().required(),
  screen2Text: Yup.string().required()
})

const defaultValues = {
  screen2Title: '',
  screen2Text: ''
}

export default ScreenInformation
export { validationSchema, defaultValues }
