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
const Screen1Information = () => {
  const classes = useStyles()
  return (
    <>
      <div className={classes.flex}>
        <H4>Screen 1 Information</H4> {/* TODO Add ? icon */}
        <Tooltip width={304}>
          <P>
            If the user reaches an amount specified by a compliance trigger that
            uses this requirement, users will be asked if they agree on
            providing you this information. If they agree, they'll be taken to
            screen 2 where they can input the information to continue the
            transaction. If they don't agree, they'll have to finalize the
            transaction. The information you enter on this input will be what
            users will see on the machine's screen. The title and description
            should very clearly state what information will be requested to
            them, and why it is necessary to proceed.
          </P>
        </Tooltip>
      </div>
      <P>
        On screen 1 you will request the user if he agrees on providing this
        information, or if he wishes to terminate the transaction instead.
      </P>
      <Field
        component={TextInputFormik}
        label="Screen title"
        name="screen1Title"
        fullWidth
      />
      <Field
        component={TextInputFormik}
        label="Screen text"
        name="screen1Text"
        multiline
        fullWidth
        rows={5}
      />
    </>
  )
}

const validationSchema = Yup.object().shape({
  screen1Title: Yup.string().required(),
  screen1Text: Yup.string().required()
})

const defaultValues = {
  screen1Title: '',
  screen1Text: ''
}

export default Screen1Information
export { validationSchema, defaultValues }
