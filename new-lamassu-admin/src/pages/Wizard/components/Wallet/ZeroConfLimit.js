import { makeStyles } from '@material-ui/core'
import React from 'react'
import * as Yup from 'yup'

import { NumberInput } from 'src/components/inputs/formik'
import { H4 } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'

import styles from './Shared.styles'

const useStyles = makeStyles(styles)

const zeroConfLimitSchema = Yup.object().shape({
  zeroConfLimit: Yup.number()
    .integer()
    .required()
    .min(0)
    .max(999999999)
})

const ZeroConfLimit = ({ data: currentData, addData }) => {
  const classes = useStyles()

  const submit = value => {
    addData({ zeroConfLimit: value })
  }

  return (
    <div className={classes.mdForm}>
      <H4>Set the 0-conf limit</H4>
      <FormRenderer
        elements={[
          {
            code: 'zeroConfLimit',
            display: `Choose a limit`,
            component: NumberInput
          }
        ]}
        validationSchema={zeroConfLimitSchema}
        buttonLabel={'Continue'}
        value={0}
        save={it => submit(Number(it.zeroConfLimit))}
      />
    </div>
  )
}

export default ZeroConfLimit
