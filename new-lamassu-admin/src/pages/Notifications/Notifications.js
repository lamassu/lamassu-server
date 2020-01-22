import React, { useState } from 'react'
import classnames from 'classnames'
import * as R from 'ramda'
import { Form, Formik, Field as FormikField } from 'formik'
import { makeStyles } from '@material-ui/core'

import Title from 'src/components/Title'
import { TL1, H4, Label1, Info1 } from 'src/components/typography'
import {
  Table,
  THead,
  TBody,
  Tr,
  Td,
  Th
} from 'src/components/fake-table/Table'
import commonStyles from 'src/pages/common.styles'
import { Switch } from 'src/components/inputs'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import TextInputFormik from 'src/components/inputs/formik/TextInput'

import { localStyles } from './Notifications.styles'

const initialValues = {
  email: {
    balance: false,
    transactions: false,
    compliance: false,
    security: false,
    errors: false,
    active: false
  },
  sms: {
    balance: false,
    transactions: false,
    compliance: false,
    security: false,
    errors: false,
    active: false
  }
}

const Row = ({ channel, columns, values }) => {
  const [state, setState] = useState(values)

  const findField = name => R.find(R.propEq('name', name))(columns)
  const findSize = name => findField(name).size
  const findAlign = name => findField(name).textAlign

  const Cell = ({ name, disabled }) => {
    const handleChange = name => event => {
      setState(R.merge(state, { [name]: event.target.checked }))
    }

    return (
      <Td size={findSize(name)} textAlign={findAlign(name)}>
        <Switch
          disabled={disabled}
          checked={state[name]}
          onChange={handleChange(name)}
          value={name}
        />
      </Td>
    )
  }

  return (
    <Tr>
      <Td size={findSize('channel')} textAlign={findAlign('channel')}>
        {channel}
      </Td>
      <Cell name="balance" disabled={!state.active} />
      <Cell name="transactions" disabled={!state.active} />
      <Cell name="compliance" disabled={!state.active} />
      <Cell name="security" disabled={!state.active} />
      <Cell name="errors" disabled={!state.active} />
      <Cell name="active" />
    </Tr>
  )
}

const fieldStyles = {
  field: {
    position: 'relative',
    width: 280,
    // height: 46,
    padding: [[0, 4, 4, 0]]
  },
  notEditing: {
    display: 'flex',
    flexDirection: 'column',
    '& > p:first-child': {
      height: 16,
      lineHeight: '16px',
      margin: [[0, 0, 11, 0]]
    },
    '& > p:last-child': {
      margin: 0
    }
  }
}

const fieldUseStyles = makeStyles(fieldStyles)

const BigEditableTextField = ({ name, value, label, editing, ...props }) => {
  const classes = fieldUseStyles()

  const classNames = {
    [classes.field]: true,
    [classes.notEditing]: !editing
  }

  return (
    <div className={classnames(classNames)}>
      <Label1 htmlFor={editing && name}>{label}</Label1>
      {!editing && (
        <>
          <Info1>{value}</Info1>
        </>
      )}
      {editing && (
        <FormikField
          id={name}
          name={name}
          component={TextInputFormik}
          type="text"
          large
          {...props}
        />
      )}
    </div>
  )
}

const styles = R.merge(commonStyles, localStyles)

const useStyles = makeStyles(styles)

const elements = [
  {
    header: 'Channel',
    name: 'channel',
    size: 129,
    textAlign: 'left'
  },
  {
    header: 'Balance',
    name: 'balance',
    size: 152,
    textAlign: 'center'
  },
  {
    header: 'Transactions',
    name: 'transactions',
    size: 184,
    textAlign: 'center'
  },
  {
    header: 'Compliance',
    name: 'compliance',
    size: 178,
    textAlign: 'center'
  },
  {
    header: 'Security',
    name: 'security',
    size: 152,
    textAlign: 'center'
  },
  {
    header: 'Errors',
    name: 'errors',
    size: 142,
    textAlign: 'center'
  },
  {
    header: 'Active',
    name: 'active',
    size: 263,
    textAlign: 'center'
  }
]

const Notifications = () => {
  const [editingHighValueTx, setEditingHighValueTx] = useState(false)
  const classes = useStyles()

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Operator information</Title>
        </div>
      </div>
      <div className={classes.section}>
        <TL1 className={classes.sectionTitle}>Setup</TL1>
        <div>
          <Table>
            <THead>
              {elements.map(({ size, className, textAlign, header }, idx) => (
                <Th
                  key={idx}
                  size={size}
                  className={className}
                  textAlign={textAlign}>
                  {header}
                </Th>
              ))}
            </THead>
            <TBody>
              <Row
                channel="Email"
                columns={elements}
                values={initialValues.email}
              />
              <Row
                channel="SMS"
                columns={elements}
                values={initialValues.sms}
              />
            </TBody>
          </Table>
        </div>
      </div>
      <div className={classes.section}>
        <TL1 className={classes.sectionTitle}>Transaction alerts</TL1>
        <div>
          <div className={classes.optionHeader}>
            <H4>High value transaction</H4>
            <button onClick={() => setEditingHighValueTx(true)}>
              <EditIcon />
            </button>
          </div>
          <div className={classes.optionBody}>
            <Formik
              enableReinitialize
              initialValues={{ alert: '5000' }}
              // validationSchema={form.validationSchema}
              // onSubmit={values => save(values)}
              // onReset={(values, bag) => {
              //   setEditing(false)
              //   setError(null)
              // }}
            >
              <Form>
                <BigEditableTextField
                  name="alert"
                  label="Alert me over"
                  // placeholder={field.placeholder}
                  large
                  editing={editingHighValueTx}
                />
              </Form>
            </Formik>
          </div>
        </div>
      </div>
    </>
  )
}

export default Notifications
