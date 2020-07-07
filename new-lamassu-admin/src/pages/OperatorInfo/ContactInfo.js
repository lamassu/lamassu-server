import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import { Form, Formik, Field as FormikField } from 'formik'
import gql from 'graphql-tag'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import * as R from 'ramda'
import React, { useState } from 'react'
import * as Yup from 'yup'

import ErrorMessage from 'src/components/ErrorMessage'
import Prompt from 'src/components/Prompt'
import { Link } from 'src/components/buttons'
import Switch from 'src/components/inputs/base/Switch'
import { TextInput, NumberInput } from 'src/components/inputs/formik'
import {
  P,
  Info2,
  Info3,
  Label1,
  Label2,
  Label3
} from 'src/components/typography'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'
import { fontSize5 } from 'src/styling/variables'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import {
  styles as globalStyles,
  contactInfoStyles
} from './OperatorInfo.styles'

const FIELD_WIDTH = 280

const fieldStyles = {
  field: {
    position: 'relative',
    width: 280,
    height: 48,
    padding: [[0, 4, 4, 0]]
  },
  notEditing: {
    display: 'flex',
    flexDirection: 'column',
    '& > p:first-child': {
      height: 16,
      lineHeight: '16px',
      fontSize: fontSize5,
      transformOrigin: 'left',
      paddingLeft: 0,
      margin: [[3, 0, 3, 0]]
    },
    '& > p:last-child': {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
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
          width={FIELD_WIDTH}
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
  const [isUnsaved, setIsUnsaved] = useState(false)
  const [editing, setEditing] = useState(false)
  const [info, setInfo] = useState(null)
  const [locale, setLocale] = useState(null)
  const [error, setError] = useState(null)
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: data => {
      setInfo(fromNamespace(namespaces.OPERATOR_INFO, data.saveConfig))
      innerSetEditing(false)
    },
    onError: e => setError(e)
  })

  useQuery(GET_CONFIG, {
    onCompleted: data => {
      setInfo(fromNamespace(namespaces.OPERATOR_INFO, data.config))
      setLocale(fromNamespace(namespaces.LOCALE, data.config))
    }
  })

  const innerSetEditing = editing => {
    setEditing(editing)
    setIsUnsaved(editing)
  }

  const save = it => {
    return saveConfig({
      variables: { config: toNamespace(namespaces.OPERATOR_INFO, it) }
    })
  }

  const classes = contactUseStyles()

  if (!info) return null

  const validationSchema = Yup.object().shape({
    active: Yup.boolean(),
    name: Yup.string(),
    phone: Yup.string().test(
      'phone',
      'Please enter a valid phone number',
      function(phone) {
        return parsePhoneNumberFromString(phone, locale.country).isValid()
      }
    ),
    email: Yup.string()
      .email('Please enter a valid email address')
      .required(),
    website: Yup.string(),
    companyNumber: Yup.number()
  })

  const fields = [
    {
      name: 'name',
      label: 'Full name',
      value: info.name ?? '',
      component: TextInput
    },
    {
      name: 'phone',
      label: 'Phone number',
      value:
        info.phone && locale.country
          ? parsePhoneNumberFromString(
              info.phone,
              locale.country
            ).formatInternational()
          : '',
      component: TextInput
    },
    {
      name: 'email',
      label: 'Email',
      value: info.email ?? '',
      component: TextInput
    },
    {
      name: 'website',
      label: 'Website',
      value: info.website ?? '',
      component: TextInput
    },
    {
      name: 'companyNumber',
      label: 'Company number',
      value: info.companyNumber ?? '',
      component: NumberInput
    }
  ]

  const findField = name => R.find(R.propEq('name', name))(fields)
  const findValue = name => findField(name).value

  const displayTextValue = value => value

  const form = {
    initialValues: {
      active: info.active,
      name: findValue('name'),
      phone: info.phone ?? '',
      email: findValue('email'),
      website: findValue('website'),
      companyNumber: findValue('companyNumber')
    }
  }

  return (
    <>
      <Prompt when={isUnsaved} />
      <div className={classes.header}>
        <Info2>Contact information</Info2>
      </div>
      <div className={classes.section}>
        <div className={classes.switchRow}>
          <P>Info card enabled?</P>
          <div className={classes.switch}>
            <Switch
              checked={info.active}
              onChange={event =>
                save({
                  active: event.target.checked
                })
              }
            />
            <Label2>{info.active ? 'Yes' : 'No'}</Label2>
          </div>
        </div>
        <div className={classes.header}>
          <Info2>Info card</Info2>
          {!editing && (
            <div className={classes.transparentButton}>
              <button onClick={() => innerSetEditing(true)}>
                <EditIcon />
              </button>
            </div>
          )}
        </div>
        <Formik
          enableReinitialize
          initialValues={form.initialValues}
          validationSchema={validationSchema}
          onSubmit={values => save(validationSchema.cast(values))}
          onReset={() => {
            innerSetEditing(false)
            setError(null)
          }}>
          <Form>
            <div className={classes.row}>
              <Field
                field={findField('name')}
                editing={editing}
                displayValue={displayTextValue}
                onFocus={() => setError(null)}
              />
              <Field
                field={findField('phone')}
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
