import { makeStyles } from '@material-ui/core/styles'
import React, { useState, memo } from 'react'
import { useQuery, useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'

import { BooleanPropertiesTable } from 'src/components/booleanPropertiesTable'
import { H4, P, Label2 } from 'src/components/typography'
import { Button } from 'src/components/buttons'
import Popper from 'src/components/Popper'
import { Switch } from 'src/components/inputs'
import { ReactComponent as HelpIcon } from 'src/styling/icons/action/help/zodiac.svg'

import { mainStyles } from './CoinATMRadar.styles'

const useStyles = makeStyles(mainStyles)

const initialValues = {
  active: false,
  // location: false,
  commissions: false,
  supportedCryptocurrencies: false,
  supportedFiat: false,
  supportedBuySellDirection: false,
  limitsAndVerification: false
  // operatorName: false,
  // operatorPhoneNumber: false,
  // operatorEmail: false
}

const GET_CONFIG = gql`
  {
    config
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const CoinATMRadar = memo(() => {
  const [helpPopperAnchorEl, setHelpPopperAnchorEl] = useState(null)
  const [coinAtmRadarConfig, setCoinAtmRadarConfig] = useState(null)

  const classes = useStyles()

  // TODO: treat errors on useMutation and useQuery
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: configResponse =>
      setCoinAtmRadarConfig(configResponse.saveConfig.coinAtmRadar)
  })
  useQuery(GET_CONFIG, {
    onCompleted: configResponse => {
      setCoinAtmRadarConfig(
        configResponse?.config?.coinAtmRadar ?? initialValues
      )
    }
  })

  const save = it => saveConfig({ variables: { config: { coinAtmRadar: it } } })

  const handleOpenHelpPopper = event => {
    setHelpPopperAnchorEl(helpPopperAnchorEl ? null : event.currentTarget)
  }

  const handleCloseHelpPopper = () => {
    setHelpPopperAnchorEl(null)
  }

  const helpPopperOpen = Boolean(helpPopperAnchorEl)

  if (!coinAtmRadarConfig) return null

  return (
    <>
      <div className={classes.rightAligned}>
        <div className={classes.button}>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://coinatmradar.com/">
            <Button>Coin ATM Radar page</Button>
          </a>
        </div>
      </div>
      <div className={classes.rowWrapper}>
        <H4>Coin ATM Radar share settings</H4>
        <div className={classes.transparentButton}>
          <button onClick={handleOpenHelpPopper}>
            <HelpIcon />
            <Popper
              open={helpPopperOpen}
              anchorEl={helpPopperAnchorEl}
              placement="bottom"
              onClose={handleCloseHelpPopper}>
              <div className={classes.popoverContent}>
                <P>
                  For details on configuring this panel, please read the
                  relevant knowledgebase article{' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://support.lamassu.is/hc/en-us/articles/360023720472-Coin-ATM-Radar">
                    here
                  </a>
                  .
                </P>
              </div>
            </Popper>
          </button>
        </div>
      </div>
      <div className={classes.rowWrapper}>
        <P>Share information?</P>
        <div className={classes.switchWrapper}>
          <Switch
            checked={coinAtmRadarConfig.active}
            onChange={event =>
              save({
                active: event.target.checked
              })
            }
          />
        </div>
        <Label2>{coinAtmRadarConfig.active ? 'Yes' : 'No'}</Label2>
      </div>
      <BooleanPropertiesTable
        title={'Machine info'}
        disabled={!coinAtmRadarConfig.active}
        data={coinAtmRadarConfig}
        elements={[
          // {
          //   name: 'location',
          //   display: 'Location',
          //   value: coinAtmRadarConfig.location
          // },
          {
            name: 'commissions',
            display: 'Commissions',
            value: coinAtmRadarConfig.commissions
          },
          {
            name: 'supportedCryptocurrencies',
            display: 'Supported Cryptocurrencies',
            value: coinAtmRadarConfig.supportedCryptocurrencies
          },
          {
            name: 'supportedFiat',
            display: 'Supported Fiat',
            value: coinAtmRadarConfig.supportedFiat
          },
          {
            name: 'supportedBuySellDirection',
            display: 'Supported Buy Sell Direction',
            value: coinAtmRadarConfig.supportedBuySellDirection
          },
          {
            name: 'limitsAndVerification',
            display: 'Limits And Verification',
            value: coinAtmRadarConfig.limitsAndVerification
          }
        ]}
        save={save}
      />
      {/* <BooleanPropertiesTable
        title={'Operator info'}
        disabled={!coinAtmRadarConfig.active}
        data={coinAtmRadarConfig}
        elements={[
          {
            name: 'operatorName',
            display: 'Operator Name',
            value: coinAtmRadarConfig.operatorName
          },
          {
            name: 'operatorPhoneNumber',
            display: 'Operator Phone Number',
            value: coinAtmRadarConfig.operatorPhoneNumber
          },
          {
            name: 'operatorEmail',
            display: 'Operator Email',
            value: coinAtmRadarConfig.operatorEmail
          }
        ]}
        save={save}
      /> */}
    </>
  )
})

export default CoinATMRadar
