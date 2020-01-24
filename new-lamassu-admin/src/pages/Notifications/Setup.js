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

const Row = ({ channel, columns, values, save }) => {
  const { active } = values

  const findField = name => R.find(R.propEq('name', name))(columns)
  const findSize = name => findField(name).size
  const findAlign = name => findField(name).textAlign

  const Cell = ({ name, disabled }) => {
    const handleChange = name => event => {
      save(R.merge(values, { [name]: event.target.checked }))
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
      <Td size={findSize('channel')} textAlign={findAlign('channel')}>
        {channel}
      </Td>
      <Cell name="balance" disabled={!active} />
      <Cell name="transactions" disabled={!active} />
      <Cell name="compliance" disabled={!active} />
      <Cell name="security" disabled={!active} />
      <Cell name="errors" disabled={!active} />
      <Cell name="active" />
    </Tr>
  )
}

const Setup = ({ values: setupValues, save }) => {
  const classes = useStyles()

  const saveSetup = R.curry((key, values) =>
    save(R.merge(setupValues, { [key]: values }))
  )

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
              values={setupValues?.email}
              save={saveSetup('email')}
            />
            <Row
              channel="SMS"
              columns={elements}
              values={setupValues?.sms}
              save={saveSetup('sms')}
            />
          </TBody>
        </FakeTable>
      </div>
    </>
  )
}

export default Setup
