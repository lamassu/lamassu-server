import { useMutation, useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import gql from 'graphql-tag'
import React, { useEffect, useState } from 'react'

import { H1, Label1, H4, P } from 'src/components/typography'
import addMachineStyles from 'src/pages/AddMachine/styles'
import {
  styles as globalStyles,
  contactInfoStyles
} from 'src/pages/OperatorInfo/OperatorInfo.styles'
import FormRenderer from 'src/pages/Services/FormRenderer'
import twilio from 'src/pages/Services/schemas/twilio'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'
import { RadioGroup } from 'src/components/inputs'
import styles from 'src/pages/Wizard/Radio.styles'
import Tooltip from 'src/components/Tooltip'
import { IconButton } from 'src/components/buttons'
import { ReactComponent as HelpIcon } from 'src/styling/icons/action/help/zodiac.svg'

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
  ...globalStyles,
  ...contactInfoStyles,
  ...addMachineStyles,
  content: {
    width: 820,
    flex: 0
  },
  radioLabel: {
    ...styles.radioLabel,
    width: 280
  }
})

const options = [
  {
    code: 'enable',
    display: 'Yes, I will add two-way machines'
  },
  {
    code: 'disable',
    display: "No, not for now"
  }
]

function Twilio({ dispatch, namespace }) {
  const { data, refetch } = useQuery(GET_CONFIG)
  const [saveAccounts] = useMutation(SAVE_ACCOUNTS)
  const accounts = data?.accounts ?? []
  const config = data?.config ?? []

  const [enable, setEnable] = useState('disable')

  useEffect(() => {
    if (!accounts?.twilio) return
    twilio.validationSchema.isValidSync(accounts.twilio) && setEnable('enable')
  }, [accounts])

  const handleRadio = enableOrNot => {
    setEnable(enableOrNot)
    enableOrNot === 'disable' && save({})
    enableOrNot === 'enable' && save({ enable: true, ...accounts?.twilio })
  }

  useEffect(() => {
    dispatch({ type: 'wizard/SET_STEP', payload: namespace })
  }, [dispatch, namespace])
  const classes = useStyles()

  const save = twilio => {
    const accounts = { twilio }
    return saveAccounts({ variables: { accounts } })
      .then(() => refetch())
      .then(({ data }) => {
        return dispatch({
          type: 'wizard/VALIDATE_STEP',
          payload: { accounts: data.accounts, config: data.config }
        })
      })
  }

  return (
    <div className={classes.wrapper}>
      <div className={classes.content}>
        <H1>Twilio (SMS service)</H1>
        <H4>
          Will you setup a two way machine?
        <Tooltip width={304} enableClick Button={IconButton} Icon={HelpIcon}>
            <P>
              Two-way machines allow your customers not only to buy (cash-in) but also sell cryptocurrencies (cash-out).</P>
            <P>
              To get your admin up and running, you’ll only need an SMS service for cash-out transactions. If you’re using one-way machines, select “No” to skip this step for now. You can later set it up within the Lamassu Admin.</P>
          </Tooltip>

        </H4>

        <RadioGroup
          labelClassName={classes.radioLabel}
          className={classes.radioGroup}
          options={options}
          value={enable}
          onChange={event => handleRadio(event.target.value)}
        />


        <div className={classnames(classes.section, classes.infoMessage)}>
          <WarningIcon />
          <Label1>
            Before configuring Twilio, create an account and phone number to use
            the Admin.
        </Label1>
        </div>
        {enable === 'enable' && (
          <FormRenderer
            xs={6}
            save={save}
            value={accounts.twilio}
            elements={twilio.elements}
            validationSchema={twilio.validationSchema}
            buttonLabel={'Save'}
          />
        )}
      </div>
    </div>
  )
}

export default Twilio
