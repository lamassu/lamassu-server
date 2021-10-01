import { makeStyles } from '@material-ui/core'
import React from 'react'

import { Button } from 'src/components/buttons'
import { H1, P } from 'src/components/typography'
import { ReactComponent as BitcoinLogo } from 'src/styling/logos/icon-bitcoin-colour.svg'
import { ReactComponent as BitcoinCashLogo } from 'src/styling/logos/icon-bitcoincash-colour.svg'
import { ReactComponent as DashLogo } from 'src/styling/logos/icon-dash-colour.svg'
import { ReactComponent as EthereumLogo } from 'src/styling/logos/icon-ethereum-colour.svg'
import { ReactComponent as LitecoinLogo } from 'src/styling/logos/icon-litecoin-colour.svg'
import { ReactComponent as TetherLogo } from 'src/styling/logos/icon-tether-colour.svg'
import { ReactComponent as ZCashLogo } from 'src/styling/logos/icon-zcash-colour.svg'

const styles = {
  logo: {
    maxHeight: 80,
    maxWidth: 200
  },
  title: {
    margin: [[24, 0, 32, 0]]
  },
  text: {
    margin: 0
  },
  button: {
    marginTop: 'auto',
    marginBottom: 58
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: [[0, 42]],
    flex: 1
  }
}

const useStyles = makeStyles(styles)

const getLogo = code => {
  switch (code) {
    case 'BTC':
      return BitcoinLogo
    case 'BCH':
      return BitcoinCashLogo
    case 'DASH':
      return DashLogo
    case 'ETH':
      return EthereumLogo
    case 'LTC':
      return LitecoinLogo
    case 'ZEC':
      return ZCashLogo
    case 'USDT':
      return TetherLogo
    default:
      return null
  }
}

const WizardSplash = ({ code, name, onContinue }) => {
  const classes = useStyles()
  const Logo = getLogo(code)

  return (
    <div className={classes.modalContent}>
      <Logo className={classes.logo} />
      <H1 className={classes.title}>Enable {name}</H1>
      <P className={classes.text}>
        You are about to enable {name} on your system. This will allow you to
        use this cryptocurrency on your machines. To be able to do that, you’ll
        have to set up all the necessary 3rd party services.
      </P>
      <Button className={classes.button} onClick={onContinue}>
        Start configuration
      </Button>
    </div>
  )
}

export default WizardSplash
