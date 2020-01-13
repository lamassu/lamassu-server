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
import {
  PhoneNumberInputFormik,
  maskValue,
  mask
} from 'src/components/inputs/formik/PhoneNumberInput'
import SwitchFormik from 'src/components/inputs/formik/Switch'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'
import { offColor } from 'src/styling/variables'

import globalStyles from './OperatorInfo.styles'

const fieldStyles = {
  field: {
    position: 'relative',
    width: 280,
    height: 46,
    padding: [[0, 4, 4, 4]]
  },
  notEditing: {
    display: 'flex',
    flexDirection: 'column',
    '& > p:first-child': {
      height: 16,
      lineHeight: '16px',
      margin: [[0, 0, 4, 0]]
    },
    '& > p:last-child': {
      margin: 0
    }
  }
}

const useStyles = makeStyles(fieldStyles)

const Field = ({ editing, field, displayValue, ...props }) => {
  const classes = useStyles()

  const classNames = {
    [classes.field]: true,
    [classes.notEditing]: !editing
  }

  return (
    <>
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
    </>
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

const ContactInfo = () => {
  const [editing, setEditing] = useState(false)
  const [info, setInfo] = useState(null)
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: data => {
      const { operatorInfo } = data.saveConfig
      setInfo(operatorInfo)
      setEditing(false)
    }
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

  const localStyles = {
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 28,
      '&:last-child': {
        marginBottom: 0
      }
    },
    infoMessage: {
      display: 'flex',
      marginBottom: 52,
      '& > p': {
        width: 330,
        color: offColor,
        marginTop: 4,
        marginLeft: 16
      }
    }
  }

  const styles = R.merge(globalStyles, localStyles)

  const useStyles = makeStyles(styles)
  const classes = useStyles()

  if (!info) return null

  const fields = [
    {
      name: 'infoCardEnabled',
      label: 'Info Card Enabled',
      value: info.infoCardEnabled ?? false,
      type: 'checkbox',
      component: SwitchFormik
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
  const displayBooleanValue = value => (value ? 'On' : 'Off')

  return (
    <>
      <div className={classes.section}>
        <Formik
          initialValues={{
            infoCardEnabled: findValue('infoCardEnabled'),
            fullName: findValue('fullName'),
            phoneNumber: info.phoneNumber ?? '',
            email: findValue('email'),
            website: findValue('website'),
            companyNumber: findValue('companyNumber')
          }}
          validationSchema={Yup.object().shape({
            fullName: Yup.string().max(100, 'Too long'),
            phoneNumber: Yup.string()
              .matches(mask, { excludeEmptyString: true })
              .max(100, 'Too long'),
            email: Yup.string()
              .email('Please enter a valid email address')
              .max(100, 'Too long'),
            website: Yup.string()
              .url('Please enter a valid url')
              .max(100, 'Too long'),
            companyNumber: Yup.string().max(30, 'Too long')
          })}
          onSubmit={values => {
            save(values)
          }}>
          <Form>
            <div className={classes.header}>
              <Info2>Contact information</Info2>
              {!editing && (
                <button onClick={() => setEditing(true)}>
                  <EditIcon />
                </button>
              )}
              {editing && (
                <button type="submit">
                  <EditIcon />
                </button>
              )}
            </div>
            <div className={classes.row}>
              <Field
                field={findField('infoCardEnabled')}
                editing={editing}
                displayValue={displayBooleanValue}
              />
            </div>
            <div className={classes.row}>
              <Field
                field={findField('fullName')}
                editing={editing}
                displayValue={displayTextValue}
              />
              <Field
                field={findField('phoneNumber')}
                editing={editing}
                displayValue={displayTextValue}
              />
            </div>
            <div className={classes.row}>
              <Field
                field={findField('email')}
                editing={editing}
                displayValue={displayTextValue}
              />
              <Field
                field={findField('website')}
                editing={editing}
                displayValue={displayTextValue}
              />
            </div>
            <div className={classes.row}>
              <Field
                field={findField('companyNumber')}
                editing={editing}
                displayValue={displayTextValue}
              />
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
