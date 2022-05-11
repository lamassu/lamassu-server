import { useMutation } from '@apollo/react-hooks'
import { Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import React, { useState } from 'react'

import Title from 'src/components/Title'
import { Button } from 'src/components/buttons'

const styles = {
  button: {
    marginBottom: 10
  }
}
const useStyles = makeStyles(styles)

const RESET = gql`
  mutation Reset($schemaVersion: Int) {
    resetConfig(schemaVersion: $schemaVersion)
    resetAccounts(schemaVersion: $schemaVersion)
  }
`

const MIGRATE = gql`
  mutation Migrate {
    migrateConfigAndAccounts
  }
`

const OLD_SCHEMA_VERSION = 1
const NEW_SCHEMA_VERSION = 2

const ConfigMigration = () => {
  const [loading, setLoading] = useState(false)
  const [reset] = useMutation(RESET, {
    onCompleted: () => setLoading(false)
  })

  const [migrate] = useMutation(MIGRATE, {
    onCompleted: () => setLoading(false)
  })

  const classes = useStyles()

  const innerReset = schemaVersion => {
    setLoading(true)
    reset({ variables: { schemaVersion } })
  }

  const innerMigrate = () => {
    setLoading(true)
    migrate()
  }

  return (
    <>
      <Title>Config Migration</Title>
      <Box display="flex" alignItems="center" flexDirection="column">
        <Button
          className={classes.button}
          disabled={loading}
          onClick={() => innerReset(OLD_SCHEMA_VERSION)}>
          Reset old admin
        </Button>
        <Button
          className={classes.button}
          disabled={loading}
          onClick={() => innerReset(NEW_SCHEMA_VERSION)}>
          Reset new admin
        </Button>
        <Button
          className={classes.button}
          disabled={loading}
          onClick={() => innerMigrate()}>
          Migrate
        </Button>
      </Box>
    </>
  )
}

export default ConfigMigration
