import React, { useState } from 'react'
import classnames from 'classnames'
import * as R from 'ramda'
import * as Yup from 'yup'
import { gql } from 'apollo-boost'
import { Form, Formik, Field as FormikField } from 'formik'
import { makeStyles } from '@material-ui/core'
import { useQuery, useMutation } from '@apollo/react-hooks'

import { Info2, Info3, Label1 } from 'src/components/typography'
import TextInputFormik from 'src/components/inputs/formik/TextInput'
import RadioGroupFormik from 'src/components/inputs/formik/RadioGroup'
import {
  PhoneNumberInputFormik,
  maskValue,
  mask
} from 'src/components/inputs/formik/PhoneNumberInput'
import { Link } from 'src/components/buttons'
import ErrorMessage from 'src/components/ErrorMessage'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'

import {
  styles as globalStyles,
  contactInfoStyles
} from './OperatorInfo.styles'

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
      paddingLeft: 3,
      margin: [[0, 0, 5, 0]]
    },
    '& > p:last-child': {
      margin: 0,
      paddingLeft: 4
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
          <Label1>{field.label}</Label1>
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

const INFO_CARD_ENABLED = 'On'
const INFO_CARD_DISABLED = 'Off'

const styles = R.merge(globalStyles, contactInfoStyles)

const contactUseStyles = makeStyles(styles)

const ContactInfo = () => {
  const [editing, setEditing] = useState(false)
  const [info, setInfo] = useState(null)
  const [error, setError] = useState(null)
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: data => {
      const { operatorInfo } = data.saveConfig
      setInfo(operatorInfo)
      setEditing(false)
    },
    onError: e => setError(e)
  })

  useQuery(GET_CONFIG, {
    onCompleted: data => {
      const { operatorInfo } = data.config
      setInfo(operatorInfo ?? {})
    }
  })

  const save = it => {
    return saveConfig({ variables: { config: { operatorInfo: it } } })
  }

  const classes = contactUseStyles()

  if (!info) return null

  const fields = [
    {
      name: 'infoCardEnabled',
      label: 'Info Card Enabled',
      value: info.infoCardEnabled ?? INFO_CARD_DISABLED,
      type: 'select',
      component: RadioGroupFormik
    },
    {
      name: 'fullName',
      label: 'Full name',
      value: info.fullName ?? '',
      type: 'text',
      component: TextInputFormik
    },
    {
      name: 'phoneNumber',
      label: 'Phone number',
      value: maskValue(info.phoneNumber) ?? '',
      type: 'text',
      component: PhoneNumberInputFormik
    },
    {
      name: 'email',
      label: 'Email',
      value: info.email ?? '',
      type: 'text',
      component: TextInputFormik
    },
    {
      name: 'website',
      label: 'Website',
      value: info.website ?? '',
      type: 'text',
      component: TextInputFormik
    },
    {
      name: 'companyNumber',
      label: 'Company number',
      value: info.companyNumber ?? '',
      type: 'text',
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
    },
    validationSchema: Yup.object().shape({
      fullName: Yup.string()
        .max(100, 'Too long')
        .required(),
      phoneNumber: Yup.string()
        .matches(mask, { excludeEmptyString: true })
        .max(100, 'Too long')
        .required(),
      email: Yup.string()
        .email('Please enter a valid email address')
        .max(100, 'Too long')
        .required(),
      website: Yup.string()
        .url('Please enter a valid url')
        .max(100, 'Too long')
        .required(),
      companyNumber: Yup.string()
        .max(30, 'Too long')
        .required()
    })
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
          validationSchema={form.validationSchema}
          onSubmit={values => save(values)}
          onReset={(values, bag) => {
            setEditing(false)
            setError(null)
          }}>
          <Form>
            <div className={classnames(classes.row, classes.radioButtonsRow)}>
              <Field
                field={findField('infoCardEnabled')}
                editing={editing}
                displayValue={displayTextValue}
                options={[
                  { label: 'On', value: INFO_CARD_ENABLED },
                  { label: 'Off', value: INFO_CARD_DISABLED }
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
