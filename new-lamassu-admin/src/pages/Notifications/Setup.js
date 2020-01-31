import React from 'react'
import * as R from 'ramda'
import { makeStyles } from '@material-ui/core'

import { Switch } from 'src/components/inputs'
import { TL1 } from 'src/components/typography'
import {
  Table as FakeTable,
  THead,
  TBody,
  Tr,
  Td,
  Th
} from 'src/components/fake-table/Table'
import commonStyles from 'src/pages/common.styles'

import { localStyles } from './Notifications.styles'
import {
  BALANCE_KEY,
  TRANSACTIONS_KEY,
  COMPLIANCE_KEY,
  SECURITY_KEY,
  ERRORS_KEY,
  ACTIVE_KEY,
  CHANNEL_KEY,
  EMAIL_KEY,
  SMS_KEY
} from './aux'

const styles = R.merge(commonStyles, localStyles)

const useStyles = makeStyles(styles)

const elements = [
  {
    header: 'Channel',
    name: CHANNEL_KEY,
    size: 129,
    textAlign: 'left'
  },
  {
    header: 'Balance',
    name: BALANCE_KEY,
    size: 152,
    textAlign: 'center'
  },
  {
    header: 'Transactions',
    name: TRANSACTIONS_KEY,
    size: 184,
    textAlign: 'center'
  },
  {
    header: 'Compliance',
    name: COMPLIANCE_KEY,
    size: 178,
    textAlign: 'center'
  },
  {
    header: 'Security',
    name: SECURITY_KEY,
    size: 152,
    textAlign: 'center'
  },
  {
    header: 'Errors',
    name: ERRORS_KEY,
    size: 142,
    textAlign: 'center'
  },
  {
    header: 'Active',
    name: ACTIVE_KEY,
    size: 263,
    textAlign: 'center'
  }
]

const Row = ({ channel, columns, values, save }) => {
  const { active } = values

  const findField = name => R.find(R.propEq('name', name))(columns)
  const findSize = name => findField(name).size
  const findAlign = name => findField(name).textAlign

  const Cell = ({ name, disabled }) => {
    const handleChange = name => event => {
      save(R.mergeDeepRight(values, { [name]: event.target.checked }))
    }

    return (
      <Td size={findSize(name)} textAlign={findAlign(name)}>
        <Switch
          disabled={disabled}
          checked={values[name]}
          onChange={handleChange(name)}
          value={name}
        />
      </Td>
    )
  }

  return (
    <Tr>
      <Td size={findSize(CHANNEL_KEY)} textAlign={findAlign(CHANNEL_KEY)}>
        {channel}
      </Td>
      <Cell name={BALANCE_KEY} disabled={!active} />
      <Cell name={TRANSACTIONS_KEY} disabled={!active} />
      <Cell name={COMPLIANCE_KEY} disabled={!active} />
      <Cell name={SECURITY_KEY} disabled={!active} />
      <Cell name={ERRORS_KEY} disabled={!active} />
      <Cell name={ACTIVE_KEY} />
    </Tr>
  )
}

const Setup = ({ values: setupValues, save }) => {
  const classes = useStyles()

  const saveSetup = R.curry((key, values) => save({ [key]: values }))

  return (
    <>
      <TL1 className={classes.sectionTitle}>Setup</TL1>
      <div>
        <FakeTable>
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
              values={setupValues[EMAIL_KEY]}
              save={saveSetup(EMAIL_KEY)}
            />
            <Row
              channel="SMS"
              columns={elements}
              values={setupValues[SMS_KEY]}
              save={saveSetup(SMS_KEY)}
            />
          </TBody>
        </FakeTable>
      </div>
    </>
  )
}

export default Setup
