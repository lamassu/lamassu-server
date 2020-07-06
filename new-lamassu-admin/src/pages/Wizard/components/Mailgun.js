import { useMutation, useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import React, { useState, useEffect } from 'react'

import { ActionButton } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs'
import { H4, Info3 } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import schema from 'src/pages/Services/schemas'
import styles from 'src/pages/Wizard/Radio.styles'
import { ReactComponent as InverseLinkIcon } from 'src/styling/icons/action/external link/white.svg'
import { ReactComponent as LinkIcon } from 'src/styling/icons/action/external link/zodiac.svg'
import { ReactComponent as WarningIcon } from 'src/styling/icons/warning-icon/comet.svg'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

const useStyles = makeStyles({
  ...styles,
  radioGroup: {
    ...styles.radioGroup,
    width: 768
  },
  radioLabel: {
    ...styles.radioLabel,
    width: 300
  }
})

const GET_CONFIG = gql`
  {
    config
    accounts
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`
const SAVE_ACCOUNTS = gql`
  mutation Save($accounts: JSONObject) {
    saveAccounts(accounts: $accounts)
  }
`

const options = [
  {
    code: 'enabled',
    display: 'Yes, send notifications to my email'
  },
  {
    code: 'disabled',
    display: "No, don't send email notifications"
  }
]

const Mailgun = () => {
  const classes = useStyles()
  const { data } = useQuery(GET_CONFIG)
  const [saveConfig] = useMutation(SAVE_CONFIG)
  const [saveAccounts] = useMutation(SAVE_ACCOUNTS)
  const [emailActive, setEmailActive] = useState(false)
  const accounts = data?.accounts ?? []

  const emailConfig =
    data?.config &&
    fromNamespace(namespaces.NOTIFICATIONS + '_email')(data.config)

  useEffect(() => {
    if (emailActive) return
    emailConfig && setEmailActive(emailConfig?.active ? 'enabled' : 'disabled')
  }, [emailActive, emailConfig])

  const handleRadio = enabled => {
    setEmailActive(enabled)
    save(enabled === 'enabled')
  }

  const save = active => {
    const config = toNamespace(`notifications_email`)({ active })
    return saveConfig({ variables: { config } })
  }

  const saveAccount = mailgun => {
    const accounts = { mailgun }
    return saveAccounts({ variables: { accounts } })
  }

  return (
    <div className={classes.mdForm}>
      <H4>Do you want to get notifications via email?</H4>
      <RadioGroup
        labelClassName={classes.radioLabel}
        className={classes.radioGroup}
        options={options}
        value={emailActive}
        onChange={event => handleRadio(event.target.value)}
      />

      <div className={classes.infoMessage}>
        <WarningIcon />
        <Info3>
          To get email notifications, you’ll need to setup Mailgun. Check out
          our article on how to set it up.
        </Info3>
      </div>
      <ActionButton
        className={classes.actionButton}
        color="primary"
        Icon={LinkIcon}
        InverseIcon={InverseLinkIcon}>
        <a
          className={classes.actionButtonLink}
          target="_blank"
          rel="noopener noreferrer"
          href="https://support.lamassu.is/hc/en-us/articles/115001203991-Email-notifications-with-Mailgun">
          Email notifications with Mailgun
        </a>
      </ActionButton>

      {emailActive === 'enabled' && (
        <>
          <H4>Mailgun credentials</H4>
          <FormRenderer
            value={accounts.mailgun}
            save={saveAccount}
            elements={schema.mailgun.elements}
            validationSchema={schema.mailgun.validationSchema}
            buttonLabel={'Save'}
          />
        </>
      )}
    </div>
  )
}

export default Mailgun
