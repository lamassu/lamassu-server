import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import { v4 } from 'uuid'

import Title from 'src/components/Title'
import { Link } from 'src/components/buttons'
import { Table as EditableTable } from 'src/components/editableTable'

import { mainStyles } from './Triggers.styles'
import Wizard from './Wizard'
import { Schema, elements } from './helper'

const useStyles = makeStyles(mainStyles)

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const GET_INFO = gql`
  query getData {
    config
  }
`

const Triggers = () => {
  const [wizard, setWizard] = useState(false)
  const [error, setError] = useState(false)

  const { data } = useQuery(GET_INFO)
  const triggers = data?.config?.triggers ?? []

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: () => setWizard(false),
    onError: () => setError(true),
    refetchQueries: () => ['getData']
  })

  const add = rawConfig => {
    const toSave = R.concat([{ id: v4(), ...rawConfig }])(triggers)
    setError(false)
    return saveConfig({ variables: { config: { triggers: toSave } } })
  }

  const save = config => {
    setError(false)
    return saveConfig({ variables: { config } })
  }

  const classes = useStyles()

  return (
    <>
      <div className={classes.titleWrapper}>
        <div className={classes.titleAndButtonsContainer}>
          <Title>Compliance Triggers</Title>
        </div>
        <div className={classes.headerLabels}>
          <Link color="primary" onClick={() => setWizard(true)}>
            + Add new trigger
          </Link>
        </div>
      </div>
      <EditableTable
        data={triggers}
        name="triggers"
        enableEdit
        enableDelete
        save={save}
        validationSchema={Schema}
        elements={elements}
      />
      {wizard && (
        <Wizard error={error} save={add} onClose={() => setWizard(null)} />
      )}
    </>
  )
}

export default Triggers
