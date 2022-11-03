import { useMutation, useQuery } from '@apollo/react-hooks'
import { makeStyles, Box } from '@material-ui/core'
import classnames from 'classnames'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import * as uuid from 'uuid'

import InfoMessage from 'src/components/InfoMessage'
import { HelpTooltip } from 'src/components/Tooltip'
import { Button, SupportLinkButton } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs'
import { H1, H4, P } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import _schemas from 'src/pages/Services/schemas'
import { getAccountInstance } from 'src/utils/accounts'

import styles from './Wallet/Shared.styles'

const GET_CONFIG = gql`
  {
    config
    accounts
  }
`

const SAVE_ACCOUNTS = gql`
  mutation Save($accounts: JSONObject) {
    saveAccounts(accounts: $accounts)
  }
`

const useStyles = makeStyles({
  ...styles,
  content: {
    width: 820
  },
  radioLabel: {
    ...styles.radioLabel,
    width: 280
  },
  wrapper: {
    width: 1200,
    height: 100,
    margin: [[0, 'auto']]
  },
  title: {
    marginLeft: 8,
    marginBottom: 5
  },
  info: {
    marginTop: 20,
    marginBottom: 20
  }
})

const options = [
  {
    code: 'enable',
    display: 'Yes, I will'
  },
  {
    code: 'disable',
    display: 'No, not for now'
  }
]

function Twilio({ doContinue }) {
  const classes = useStyles()
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(false)

  const { data, refetch } = useQuery(GET_CONFIG)
  const [saveAccounts] = useMutation(SAVE_ACCOUNTS, {
    onCompleted: doContinue
  })

  const accounts = data?.accounts ?? []

  const onSelect = e => {
    setSelected(e.target.value)
    setError(false)
  }

  const clickContinue = () => {
    if (!selected) return setError(true)
    doContinue()
  }

  const schemas = _schemas({})
  const save = newAccount => {
    const accountObj = R.pick(
      ['category', 'code', 'elements', 'name'],
      schemas.twilio
    )

    const accountInstances = R.isNil(accounts.twilio)
      ? []
      : R.clone(accounts.twilio.instances)

    accountInstances.push(R.merge(newAccount, { id: uuid.v4(), enabled: true }))

    return saveAccounts({
      variables: {
        accounts: {
          twilio: {
            ...accountObj,
            instances: accountInstances
          }
        }
      }
    }).then(() => refetch())
  }

  const titleClasses = {
    [classes.title]: true,
    [classes.error]: error
  }

  return (
    <div className={classes.wrapper}>
      <div className={classes.content}>
        <H1>Twilio (SMS service)</H1>
        <Box display="flex" alignItems="end">
          <H4 noMargin className={classnames(titleClasses)}>
            Will you setup a two way machine or compliance?
          </H4>
          <HelpTooltip width={304}>
            <P>
              Two-way machines allow your customers not only to buy (cash-in)
              but also sell cryptocurrencies (cash-out).
            </P>
            <P>
              You’ll need an SMS service for cash-out transactions and for any
              compliance triggers
            </P>
          </HelpTooltip>
        </Box>

        <RadioGroup
          labelClassName={classes.radioLabel}
          className={classes.radioGroup}
          options={options}
          value={selected}
          onChange={onSelect}
        />

        <InfoMessage className={classes.info}>
          To set up Twilio please read the instructions from our support portal.
        </InfoMessage>
        <SupportLinkButton
          link="https://support.lamassu.is/hc/en-us/articles/115001203951-Twilio-for-SMS"
          label="Twilio for SMS"
        />

        {selected === 'enable' && (
          <>
            <H4 noMargin>Enter credentials</H4>
            <FormRenderer
              xs={6}
              save={save}
              value={getAccountInstance(accounts.twilio, 'twilio')}
              elements={schemas.twilio.elements}
              validationSchema={schemas.twilio.getValidationSchema(
                getAccountInstance(accounts.twilio, 'twilio')
              )}
              buttonLabel={'Continue'}
              buttonClass={classes.formButton}
            />
          </>
        )}
        {selected !== 'enable' && (
          <Button size="lg" onClick={clickContinue} className={classes.button}>
            Continue
          </Button>
        )}
      </div>
    </div>
  )
}

export default Twilio
