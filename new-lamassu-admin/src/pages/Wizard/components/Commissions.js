import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'

import { Table as EditableTable } from 'src/components/editableTable'
import Section from 'src/components/layout/Section'
import TitleSection from 'src/components/layout/TitleSection'
import styles from 'src/pages/AddMachine/styles'
import { mainFields, defaults, getSchema } from 'src/pages/Commissions/helper'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

const useStyles = makeStyles(styles)
const useCommissionStyles = makeStyles({
  autoComplete: {
    width: '100%'
  }
})

const GET_DATA = gql`
  query getData {
    localesConfig
    commissionsConfig
  }
`
const SAVE_COMMISSIONS = gql`
  mutation Save($config: JSONObject) {
    saveCommissions(config: $config)
  }
`

function Commissions({ isActive, doContinue }) {
  const classes = useStyles()
  const commissionClasses = useCommissionStyles()
  const { data } = useQuery(GET_DATA)

  const [saveCommissions] = useMutation(SAVE_COMMISSIONS, {
    onCompleted: doContinue
  })

  const save = it => {
    const config = toNamespace(namespaces.COMMISSIONS)(it.commissions[0])
    return saveCommissions({ variables: { config } })
  }

  const locale = fromNamespace(namespaces.LOCALE)(data?.localesConfig)
  const currency = R.path(['fiatCurrency'])(locale)

  return (
    <div className={classes.wrapper}>
      <TitleSection title="Commissions" />
      <Section>
        <EditableTable
          title="Default setup"
          rowSize="lg"
          titleLg
          name="commissions"
          initialValues={defaults}
          enableEdit
          forceAdd={isActive}
          save={save}
          validationSchema={getSchema(locale)}
          data={[]}
          elements={mainFields(currency, locale, commissionClasses)}
        />
      </Section>
    </div>
  )
}

export default Commissions
