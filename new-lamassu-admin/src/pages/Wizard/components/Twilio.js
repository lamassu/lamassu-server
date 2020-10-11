import { useMutation, useQuery } from '@apollo/react-hooks'
import { makeStyles, Box } from '@material-ui/core'
import classnames from 'classnames'
import gql from 'graphql-tag'
import React, { useState } from 'react'

import InfoMessage from 'src/components/InfoMessage'
import Tooltip from 'src/components/Tooltip'
import { Button } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs'
import { H1, H4, P } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import twilio from 'src/pages/Services/schemas/twilio'

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

  const save = twilio => {
    const accounts = { twilio }
    return saveAccounts({ variables: { accounts } }).then(() => refetch())
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
          <Tooltip width={304}>
            <P>
              Two-way machines allow your customers not only to buy (cash-in)
              but also sell cryptocurrencies (cash-out).
            </P>
            <P>
              You’ll need an SMS service for cash-out transactions and for any
              complaince triggers
            </P>
          </Tooltip>
        </Box>

        <RadioGroup
          labelClassName={classes.radioLabel}
          className={classes.radioGroup}
          options={options}
          value={selected}
          onChange={onSelect}
        />

        <InfoMessage className={classes.info}>
          Before configuring Twilio, create an account and phone number to use
          the Admin.
        </InfoMessage>

        {selected === 'enable' && (
          <>
            <H4 noMargin>Enter credentials</H4>
            <FormRenderer
              xs={6}
              save={save}
              value={accounts.twilio}
              elements={twilio.elements}
              validationSchema={twilio.validationSchema}
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
