import { useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import { Formik, Form, Field } from 'formik'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import { TextInput } from 'src/components/inputs/formik'
import { Info3 } from 'src/components/typography'

import styles from './CustomerNotes.styles'
import { PropertyCard } from './propertyCard'

const validationSchema = Yup.object().shape({
  notes: Yup.string()
})

const SAVE_CUSTOMER_NOTES = gql`
  mutation setCustomerNotes($customerId: ID!, $newContent: String!) {
    setCustomerNotes(customerId: $customerId, newContent: $newContent) {
      notes
    }
  }
`

const useStyles = makeStyles(styles)

const CustomerNotes = ({ customer }) => {
  const classes = useStyles()

  const [editing, setEditing] = useState(false)
  const [setNotes] = useMutation(SAVE_CUSTOMER_NOTES, {
    refetchQueries: () => ['customer']
  })

  const initialValues = {
    notes: R.path(['notes'])(customer) ?? ''
  }

  const handleConfirm = values => {
    setNotes({
      variables: {
        customerId: customer.id,
        newContent: values.notes
      }
    })
    setEditing(false)
  }

  const getFormattedNotes = content => {
    const fragments = R.split(/\n/)(content ?? '')
    return R.map((it, idx) => {
      if (idx === fragments.length) return <>{it}</>
      return (
        <>
          {it}
          <br />
        </>
      )
    }, fragments)
  }

  return (
    <PropertyCard
      title={'Notes'}
      edit={() => setEditing(true)}
      confirm={true}
      isEditing={editing}
      formName="notes-form"
      className={classes.root}
      contentClassName={classes.content}>
      {!editing && (
        <Info3>{getFormattedNotes(R.path(['notes'])(customer))}</Info3>
      )}
      {editing && (
        <Formik
          validateOnBlur={false}
          validateOnChange={false}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={values => handleConfirm(values)}>
          <Form id="notes-form" className={classes.form}>
            <Field
              name="notes"
              fullWidth
              multiline={true}
              rows={6}
              component={TextInput}
            />
          </Form>
        </Formik>
      )}
    </PropertyCard>
  )
}

export default CustomerNotes
