import { useMutation, useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import React, { useState, useEffect } from 'react'

import { Link } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs'
import { P, H4 } from 'src/components/typography'
import FormRenderer from 'src/pages/Services/FormRenderer'
import schema from 'src/pages/Services/schemas'
import styles from 'src/pages/Wizard/Radio.styles'

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
  mutation Save($accounts: JSONObject) {
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

const Blockcypher = () => {
  const { data } = useQuery(GET_CONFIG)
  const accounts = data?.accounts ?? []

  const classes = useStyles()
  const [saveConfig] = useMutation(SAVE_ACCOUNTS)
  const [currentCode, setCurrentCode] = useState('disable')

  useEffect(() => {
    if (!accounts?.blockcypher) return
    schema.blockcypher.validationSchema.isValidSync(accounts.blockcypher) &&
      setCurrentCode('enable')
  }, [accounts])

  const handleRadio = cashoutOrNot => {
    setCurrentCode(cashoutOrNot)
    cashoutOrNot === 'disable' && save({})
  }

  const save = blockcypher => {
    const accounts = { blockcypher }
    return saveConfig({ variables: { accounts } })
  }

  return (
    <>
      <H4>Blockcypher</H4>
      <P>
        If you are enabling cash-out services,{' '}
        <Link>
          <a
            className={classes.actionButtonLink}
            target="_blank"
            rel="noopener noreferrer"
            href="https://support.lamassu.is/hc/en-us/articles/115001209472-Blockcypher">
            create a Blockcypher account.
          </a>
        </Link>
      </P>
      <RadioGroup
        labelClassName={classes.radioLabel}
        className={classes.radioGroup}
        options={options}
        value={currentCode}
        onChange={event => handleRadio(event.target.value)}
      />
      <div className={classes.mdForm}>
        {currentCode === 'enable' && (
          <FormRenderer
            value={accounts.blockcypher}
            save={save}
            elements={schema.blockcypher.elements}
            validationSchema={schema.blockcypher.validationSchema}
            buttonLabel={'Save'}
          />
        )}
      </div>
    </>
  )
}

export default Blockcypher
