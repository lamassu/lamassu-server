import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import { Form, Formik, Field } from 'formik'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import ErrorMessage from 'src/components/ErrorMessage'
import { Button } from 'src/components/buttons'
import { Switch } from 'src/components/inputs'
import TextInputFormik from 'src/components/inputs/formik/TextInput'
import { Info2, Label2 } from 'src/components/typography'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import {
  styles as globalStyles,
  termsConditionsStyles
} from './OperatorInfo.styles'

const GET_CONFIG = gql`
  {
    config
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const styles = R.merge(globalStyles, termsConditionsStyles)

const useStyles = makeStyles(styles)

const TermsConditions = () => {
  const [showOnScreen, setShowOnScreen] = useState(false)
  const [formData, setFormData] = useState(null)
  const [error, setError] = useState(null)
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: data => {
      const termsAndConditions = fromNamespace(
        namespaces.TERMS_CONDITIONS,
        data.saveConfig
      )
      setFormData(termsAndConditions)
      setShowOnScreen(termsAndConditions.active)
      setError(null)
    },
    onError: e => setError(e)
  })

  const classes = useStyles()

  useQuery(GET_CONFIG, {
    onCompleted: data => {
      const termsAndConditions = fromNamespace(
        namespaces.TERMS_CONDITIONS,
        data.config
      )
      setFormData(termsAndConditions ?? {})
      setShowOnScreen(termsAndConditions?.active ?? false)
    }
  })

  const save = it => {
    setError(null)
    return saveConfig({
      variables: { config: toNamespace(namespaces.TERMS_CONDITIONS, it) }
    })
  }

  const handleEnable = () => {
    const s = !showOnScreen
    save({ active: s })
  }

  if (!formData) return null

  const fields = [
    {
      name: 'title',
      label: 'Screen title',
      value: formData.title ?? '',
      width: 282
    },
    {
      name: 'text',
      label: 'Text content',
      value: formData.text ?? '',
      width: 502,
      multiline: true,
      rows: 6
    },
    {
      name: 'acceptButtonText',
      label: 'Accept button text',
      value: formData.acceptButtonText ?? '',
      placeholder: 'I accept',
      width: 282
    },
    {
      name: 'cancelButtonText',
      label: 'Cancel button text',
      value: formData.cancelButtonText ?? '',
      placeholder: 'Cancel',
      width: 282
    }
  ]

  const findField = name => R.find(R.propEq('name', name))(fields)
  const findValue = name => findField(name).value

  const initialValues = {
    title: findValue('title'),
    text: findValue('text'),
    acceptButtonText: findValue('acceptButtonText'),
    cancelButtonText: findValue('cancelButtonText')
  }

  const validationSchema = Yup.object().shape({
    title: Yup.string().max(50, 'Too long'),
    acceptButtonText: Yup.string().max(15, 'Too long'),
    cancelButtonText: Yup.string().max(15, 'Too long')
  })

  return (
    <>
      <div className={classes.header}>
        <Info2>Terms &amp; Conditions</Info2>
      </div>
      <div className={classes.section}>
        <div className={classes.enable}>
          <span>Show on screen</span>
          <Switch checked={showOnScreen} onChange={handleEnable} value="show" />
          <Label2>{showOnScreen ? 'Yes' : 'No'}</Label2>
        </div>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={values => {
            save(values)
          }}>
          <Form>
            {fields.map((f, idx) => (
              <div className={classes.row} key={idx}>
                <Field
                  id={f.name}
                  name={f.name}
                  component={TextInputFormik}
                  width={f.width}
                  placeholder={f.placeholder}
                  type="text"
                  label={f.label}
                  multiline={f.multiline}
                  rows={f.rows}
                  rowsMax="6"
                  onFocus={() => setError(null)}
                />
              </div>
            ))}
            <div
              className={classnames(
                classes.row,
                classes.submit,
                classes.singleButton
              )}>
              <Button type="submit">Submit</Button>
              {error && (
                <ErrorMessage className={classes.errorMessage}>
                  Failed to save changes
                </ErrorMessage>
              )}
            </div>
          </Form>
        </Formik>
      </div>
    </>
  )
}

export default TermsConditions
