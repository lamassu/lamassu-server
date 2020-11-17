import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Box } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { SubpageButton } from 'src/components/buttons'
import TitleSection from 'src/components/layout/TitleSection'
import { ReactComponent as ExeceptionViewIcon } from 'src/styling/icons/circle buttons/exception-view/white.svg'
import { ReactComponent as ListingViewIcon } from 'src/styling/icons/circle buttons/listing-view/zodiac.svg'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import CommissionsDetails from './components/CommissionsDetails'
import CommissionsList from './components/CommissionsList'

const GET_DATA = gql`
  query getData {
    config
    cryptoCurrencies {
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

const styles = {
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row'
  },
  subpageButton: {
    marginLeft: 12
  },
  colorLabel: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    '& div': {
      width: 12,
      height: 12,
      borderRadius: 3,
      marginRight: 8,
      backgroundColor: '#44e188'
    }
  }
}

const useStyles = makeStyles(styles)

const Commissions = ({ name: SCREEN_KEY }) => {
  const classes = useStyles()

  const [showMachines, setShowMachines] = useState(false)
  const { data } = useQuery(GET_DATA)
  const [saveConfig, { error }] = useMutation(SAVE_CONFIG, {
    refetchQueries: () => ['getData']
  })

  const config = data?.config && fromNamespace(SCREEN_KEY)(data.config)
  const localeConfig =
    data?.config && fromNamespace(namespaces.LOCALE)(data.config)

  const currency = R.path(['fiatCurrency'])(localeConfig)

  const save = it => {
    const config = toNamespace(SCREEN_KEY)(it.commissions[0])
    return saveConfig({ variables: { config } })
  }

  const saveOverrides = it => {
    const config = toNamespace(SCREEN_KEY)(it)
    return saveConfig({ variables: { config } })
  }

  return (
    <>
      <Box className={classes.titleWrapper}>
        <TitleSection title="Commissions" />
        <SubpageButton
          className={classes.subpageButton}
          Icon={ListingViewIcon}
          InverseIcon={ExeceptionViewIcon}
          toggle={setShowMachines}>
          List view
        </SubpageButton>
        {showMachines && (
          <div className={classes.colorLabel}>
            <div className={classes.greenSquare} />
            <span>Override value</span>
          </div>
        )}
      </Box>
      {!showMachines && (
        <CommissionsDetails
          config={config}
          currency={currency}
          data={data}
          error={error}
          save={save}
          saveOverrides={saveOverrides}
        />
      )}
      {showMachines && (
        <CommissionsList
          config={config}
          localeConfig={localeConfig}
          currency={currency}
          data={data}
          error={error}
        />
      )}
    </>
  )
}

export default Commissions
