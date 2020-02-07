import { makeStyles } from '@material-ui/core'
import React from 'react'

import { Button } from 'src/components/buttons'
import { H1, P } from 'src/components/typography'
import { ReactComponent as BitcoinLogo } from 'src/styling/logos/icon-bitcoin-colour.svg'
import { ReactComponent as BitcoinCashLogo } from 'src/styling/logos/icon-bitcoincash-colour.svg'
import { ReactComponent as DashLogo } from 'src/styling/logos/icon-dash-colour.svg'
import { ReactComponent as EthereumLogo } from 'src/styling/logos/icon-ethereum-colour.svg'
import { ReactComponent as LitecoinLogo } from 'src/styling/logos/icon-litecoin-colour.svg'
import { ReactComponent as ZCashLogo } from 'src/styling/logos/icon-zcash-colour.svg'

const styles = {
  logoWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 80,
    margin: [[40, 0, 24]],
    '& > svg': {
      maxHeight: '100%',
      width: '100%'
    }
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: [[0, 66]],
    '& > h1': {
      margin: [[0, 0, 32]]
    },
    '& > p': {
      margin: 0
    },
    '& > button': {
      margin: [['auto', 0, 56]],
      '&:active': {
        margin: [['auto', 0, 56]]
      }
    }
  }
}

const useStyles = makeStyles(styles)

const renderLogo = code => {
  switch (code) {
    case 'BTC':
      return <BitcoinLogo />
    case 'BCH':
      return <BitcoinCashLogo />
    case 'DASH':
      return <DashLogo />
    case 'ETH':
      return <EthereumLogo />
    case 'LTC':
      return <LitecoinLogo />
    case 'ZEC':
      return <ZCashLogo />
    default:
      return null
  }
}

const WizardSplash = ({ code, coinName, handleModalNavigation }) => {
  const classes = useStyles()

  return (
    <div className={classes.modalContent}>
      <div className={classes.logoWrapper}>{renderLogo(code)}</div>
      <H1>Enable {coinName}</H1>
      <P>
        You are about to enable {coinName} on your system. This will allow you
        to use this cryptocurrency on your machines. To able to do that, you’ll
        have to setup all the necessary 3rd party services.
      </P>
      <Button onClick={() => handleModalNavigation(1)}>
        Start configuration
      </Button>
    </div>
  )
}

export default WizardSplash
