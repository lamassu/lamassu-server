import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'

import { Table as EditableTable } from 'src/components/editableTable'
import Section from 'src/components/layout/Section'
import TitleSection from 'src/components/layout/TitleSection'
import styles from 'src/pages/AddMachine/styles'
import { mainFields, defaults, schema } from 'src/pages/Commissions/helper'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

const useStyles = makeStyles(styles)
const useCommissionStyles = makeStyles({
  autoComplete: {
    width: '100%'
  }
})

const GET_DATA = gql`
  query getData {
    config
  }
`
const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

function Commissions({ isActive, doContinue }) {
  const classes = useStyles()
  const commissionClasses = useCommissionStyles()
  const { data } = useQuery(GET_DATA)

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: doContinue
  })

  const save = it => {
    const config = toNamespace('commissions')(it.commissions[0])
    return saveConfig({ variables: { config } })
  }

  const currency = R.path(['fiatCurrency'])(
    fromNamespace(namespaces.LOCALE)(data?.config)
  )

  const locale = fromNamespace(namespaces.LOCALE)(data?.config)

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
          validationSchema={schema}
          data={[]}
          elements={mainFields(currency, locale, commissionClasses)}
        />
      </Section>
    </div>
  )
}

export default Commissions
