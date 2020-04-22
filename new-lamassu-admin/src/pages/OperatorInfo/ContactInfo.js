import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import { gql } from 'apollo-boost'
import classnames from 'classnames'
import { Form, Formik, Field as FormikField } from 'formik'
import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import ErrorMessage from 'src/components/ErrorMessage'
import { Link } from 'src/components/buttons'
import RadioGroupFormik from 'src/components/inputs/formik/RadioGroup'
import TextInputFormik from 'src/components/inputs/formik/TextInput'
import { Info2, Info3, Label1, Label3 } from 'src/components/typography'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import {
  styles as globalStyles,
  contactInfoStyles
} from './OperatorInfo.styles'

const validationSchema = Yup.object().shape({
  infoCardEnabled: Yup.boolean().required(),
  fullName: Yup.string().required(),
  phoneNumber: Yup.string().required(),
  email: Yup.string()
    .email('Please enter a valid email address')
    .required(),
  website: Yup.string().required(),
  companyNumber: Yup.string().required()
})

const fieldStyles = {
  field: {
    position: 'relative',
    width: 280,
    height: 46,
    padding: [[0, 4, 4, 0]]
  },
  notEditing: {
    display: 'flex',
    flexDirection: 'column',
    '& > p:first-child': {
      height: 16,
      lineHeight: '16px',
      transform: 'scale(0.75)',
      transformOrigin: 'left',
      paddingLeft: 0,
      margin: [[0, 0, 5, 0]]
    },
    '& > p:last-child': {
      margin: 0
    }
  }
}

const fieldUseStyles = makeStyles(fieldStyles)

const Field = ({ editing, field, displayValue, ...props }) => {
  const classes = fieldUseStyles()

  const classNames = {
    [classes.field]: true,
    [classes.notEditing]: !editing
  }

  return (
    <div className={classnames(classNames)}>
      {!editing && (
        <>
          <Label3>{field.label}</Label3>
          <Info3>{displayValue(field.value)}</Info3>
        </>
      )}
      {editing && (
        <FormikField
          id={field.name}
          name={field.name}
          component={field.component}
          placeholder={field.placeholder}
          type={field.type}
          label={field.label}
          {...props}
        />
      )}
    </div>
  )
}

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

const styles = R.merge(globalStyles, contactInfoStyles)

const contactUseStyles = makeStyles(styles)

const ContactInfo = () => {
  const [editing, setEditing] = useState(false)
  const [info, setInfo] = useState(null)
  const [error, setError] = useState(null)
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: data => {
      setInfo(fromNamespace(namespaces.CONTACT_INFO, data.saveConfig))
      setEditing(false)
    },
    onError: e => setError(e)
  })

  useQuery(GET_CONFIG, {
    onCompleted: data => {
      setInfo(fromNamespace(namespaces.CONTACT_INFO, data.config))
    }
  })

  const save = it => {
    return saveConfig({
      variables: { config: toNamespace(namespaces.CONTACT_INFO, it) }
    })
  }

  const classes = contactUseStyles()

  if (!info) return null

  const fields = [
    {
      name: 'infoCardEnabled',
      label: 'Info Card Enabled',
      value: String(info.infoCardEnabled),
      component: RadioGroupFormik
    },
    {
      name: 'fullName',
      label: 'Full name',
      value: info.fullName ?? '',
      component: TextInputFormik
    },
    {
      name: 'phoneNumber',
      label: 'Phone number',
      value: info.phoneNumber ?? '',
      component: TextInputFormik
    },
    {
      name: 'email',
      label: 'Email',
      value: info.email ?? '',
      component: TextInputFormik
    },
    {
      name: 'website',
      label: 'Website',
      value: info.website ?? '',
      component: TextInputFormik
    },
    {
      name: 'companyNumber',
      label: 'Company number',
      value: info.companyNumber ?? '',
      component: TextInputFormik
    }
  ]

  const findField = name => R.find(R.propEq('name', name))(fields)
  const findValue = name => findField(name).value

  const displayTextValue = value => value

  const form = {
    initialValues: {
      infoCardEnabled: findValue('infoCardEnabled'),
      fullName: findValue('fullName'),
      phoneNumber: info.phoneNumber ?? '',
      email: findValue('email'),
      website: findValue('website'),
      companyNumber: findValue('companyNumber')
    }
  }

  return (
    <>
      <div className={classes.header}>
        <Info2>Contact information</Info2>
        {!editing && (
          <div>
            <button onClick={() => setEditing(true)}>
              <EditIcon />
            </button>
          </div>
        )}
      </div>
      <div className={classes.section}>
        <Formik
          enableReinitialize
          initialValues={form.initialValues}
          validationSchema={validationSchema}
          onSubmit={values => save(validationSchema.cast(values))}
          onReset={() => {
            setEditing(false)
            setError(null)
          }}>
          <Form>
            <div className={classnames(classes.row, classes.radioButtonsRow)}>
              <Field
                field={findField('infoCardEnabled')}
                editing={editing}
                displayValue={it => (it === 'true' ? 'On' : 'Off')}
                options={[
                  { display: 'On', code: 'true' },
                  { display: 'Off', code: 'false' }
                ]}
                className={classes.radioButtons}
                resetError={() => setError(null)}
              />
            </div>
            <div className={classes.row}>
              <Field
                field={findField('fullName')}
                editing={editing}
                displayValue={displayTextValue}
                onFocus={() => setError(null)}
              />
              <Field
                field={findField('phoneNumber')}
                editing={editing}
                displayValue={displayTextValue}
                onFocus={() => setError(null)}
              />
            </div>
            <div className={classes.row}>
              <Field
                field={findField('email')}
                editing={editing}
                displayValue={displayTextValue}
                onFocus={() => setError(null)}
              />
              <Field
                field={findField('website')}
                editing={editing}
                displayValue={displayTextValue}
                onFocus={() => setError(null)}
              />
            </div>
            <div className={classes.row}>
              <Field
                field={findField('companyNumber')}
                editing={editing}
                displayValue={displayTextValue}
                onFocus={() => setError(null)}
              />
            </div>
            <div className={classnames(classes.row, classes.submit)}>
              {editing && (
                <>
                  <Link color="primary" type="submit">
                    Save
                  </Link>
                  <Link color="secondary" type="reset">
                    Cancel
                  </Link>
                  {error && (
                    <ErrorMessage className={classes.errorMessage}>
                      Failed to save changes
                    </ErrorMessage>
                  )}
                </>
              )}
            </div>
          </Form>
        </Formik>
      </div>
      <div className={classnames(classes.section, classes.infoMessage)}>
        <WarningIcon />
        <Label1>
          Sharing your information with your customers through your machines
          allows them to contact you in case there's a problem with a machine in
          your network or a transaction.
        </Label1>
      </div>
    </>
  )
}

export default ContactInfo
