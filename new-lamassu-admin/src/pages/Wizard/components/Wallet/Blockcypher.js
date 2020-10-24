import { useMutation, useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import React, { useState } from 'react'

import { SupportLinkButton, Button } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs'
import { P, H4 } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import schema from 'src/pages/Services/schemas'

import styles from './Shared.styles'

const useStyles = makeStyles({
  ...styles,
  radioGroup: styles.radioGroup,
  radioLabel: {
    ...styles.radioLabel,
    width: 200
  }
})

const GET_CONFIG = gql`
  {
    accounts
  }
`
const SAVE_ACCOUNTS = gql`
  mutation SaveAccountsBC($accounts: JSONObject) {
    saveAccounts(accounts: $accounts)
  }
`

const options = [
  {
    code: 'enable',
    display: 'I will enable cash-out'
  },
  {
    code: 'disable',
    display: "I won't enable cash-out"
  }
]

const Blockcypher = ({ addData }) => {
  const classes = useStyles()

  const { data } = useQuery(GET_CONFIG)
  const [saveConfig] = useMutation(SAVE_ACCOUNTS, {
    onCompleted: () => addData({ zeroConf: 'blockcypher' })
  })

  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(false)

  const accounts = data?.accounts ?? []

  const onSelect = e => {
    setSelected(e.target.value)
    setError(false)
  }

  const save = blockcypher => {
    const accounts = { blockcypher }
    return saveConfig({ variables: { accounts } })
  }

  return (
    <>
      <H4 className={error && classes.error}>Blockcypher</H4>
      <P>
        If you are enabling cash-out services, create a Blockcypher account.
      </P>
      <SupportLinkButton
        link="https://support.lamassu.is/hc/en-us/articles/115001209472-Blockcypher"
        label="Configuring Blockcypher"
      />
      <RadioGroup
        labelClassName={classes.radioLabel}
        className={classes.radioGroup}
        options={options}
        value={selected}
        onChange={onSelect}
      />
      <div className={classes.mdForm}>
        {selected === 'disable' && (
          <Button
            size="lg"
            onClick={() => addData({ zeroConf: 'all-zero-conf' })}
            className={classes.button}>
            Continue
          </Button>
        )}
        {selected === 'enable' && (
          <FormRenderer
            value={accounts.blockcypher}
            save={save}
            elements={schema.blockcypher.elements}
            validationSchema={schema.blockcypher.validationSchema}
            buttonLabel={'Continue'}
            buttonClass={classes.formButton}
          />
        )}
      </div>
    </>
  )
}

export default Blockcypher
