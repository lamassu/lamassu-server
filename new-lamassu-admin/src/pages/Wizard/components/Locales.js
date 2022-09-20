import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'

import { Table as EditableTable } from 'src/components/editableTable'
import Section from 'src/components/layout/Section'
import TitleSection from 'src/components/layout/TitleSection'
import styles from 'src/pages/AddMachine/styles'
import {
  mainFields,
  localeDefaults as defaults,
  LocaleSchema as schema
} from 'src/pages/Locales/helper'
import { namespaces, toNamespace } from 'src/utils/config'

import { getConfiguredCoins } from '../helper'

const useStyles = makeStyles(styles)

const GET_DATA = gql`
  query getData {
    walletConfig
    accounts
    currencies {
      code
      display
    }
    countries {
      code
      display
    }
    cryptoCurrencies {
      code
      display
    }
    languages {
      code
      display
    }
    machines {
      name
      deviceId
    }
  }
`

const SAVE_LOCALES = gql`
  mutation Save($config: JSONObject) {
    saveLocales(config: $config)
  }
`

function Locales({ isActive, doContinue }) {
  const classes = useStyles()
  const { data } = useQuery(GET_DATA)

  const [saveLocales] = useMutation(SAVE_LOCALES, {
    onCompleted: doContinue
  })

  const save = it => {
    const config = toNamespace(namespaces.LOCALE)(it.locale[0])
    return saveLocales({ variables: { config } })
  }

  const cryptoCurrencies = getConfiguredCoins(
    data?.walletConfig || {},
    data?.cryptoCurrencies || []
  )

  const onChangeCoin = (prev, curr, setValue) => setValue(curr)

  return (
    <div className={classes.wrapper}>
      <TitleSection title="Locales" />
      <Section>
        <EditableTable
          title="Default settings"
          rowSize="lg"
          titleLg
          name="locale"
          initialValues={defaults}
          forceAdd={isActive}
          enableEdit
          save={save}
          validationSchema={schema}
          data={[]}
          elements={mainFields(
            R.merge(data, { cryptoCurrencies }),
            onChangeCoin
          )}
        />
      </Section>
    </div>
  )
}

export default Locales
