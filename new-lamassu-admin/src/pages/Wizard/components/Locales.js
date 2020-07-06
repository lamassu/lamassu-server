import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useEffect } from 'react'

import { Table as EditableTable } from 'src/components/editableTable'
import Section from 'src/components/layout/Section'
import TitleSection from 'src/components/layout/TitleSection'
import styles from 'src/pages/AddMachine/styles'
import {
  mainFields,
  localeDefaults as defaults,
  LocaleSchema as schema
} from 'src/pages/Locales/helper'
import { fromNamespace, toNamespace } from 'src/utils/config'

const useStyles = makeStyles(styles)

const GET_DATA = gql`
  query getData {
    config
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

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

function Locales({ dispatch, namespace }) {
  const classes = useStyles()
  const { data, refetch } = useQuery(GET_DATA)

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    refetchQueries: () => ['getData']
  })

  useEffect(() => {
    dispatch({ type: 'wizard/SET_STEP', payload: namespace })
  }, [dispatch, namespace])

  const config = data?.config && fromNamespace(namespace)(data.config)
  const locale = config && !R.isEmpty(config) ? config : defaults

  const save = it => {
    const config = toNamespace(namespace)(it[namespace][0])
    return saveConfig({ variables: { config } })
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
      <TitleSection title="Locales" />
      <Section>
        <EditableTable
          title="Default settings"
          rowSize="lg"
          titleLg
          name="locale"
          enableEdit
          initialValues={locale}
          save={save}
          validationSchema={schema}
          data={R.of(locale)}
          elements={mainFields(data)}
        />
      </Section>
    </div>
  )
}

export default Locales
