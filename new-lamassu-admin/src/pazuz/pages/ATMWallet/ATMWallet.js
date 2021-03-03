/* eslint-disable no-unused-vars */
import { Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React from 'react'

import TitleSection from 'src/components/layout/TitleSection'
import { H3, Info2, Label2, Label3, P } from 'src/components/typography'
import { ReactComponent as BitcoinLogo } from 'src/styling/logos/icon-bitcoin-colour.svg'
import { ReactComponent as BitcoinCashLogo } from 'src/styling/logos/icon-bitcoincash-colour.svg'
import { ReactComponent as DashLogo } from 'src/styling/logos/icon-dash-colour.svg'
import { ReactComponent as EthereumLogo } from 'src/styling/logos/icon-ethereum-colour.svg'
import { ReactComponent as LitecoinLogo } from 'src/styling/logos/icon-litecoin-colour.svg'
import { ReactComponent as ZCashLogo } from 'src/styling/logos/icon-zcash-colour.svg'

import styles from './ATMWallet.styles'

const useStyles = makeStyles(styles)

const CHIPS_PER_ROW = 6

const Assets = ({ balance, wallets, currency }) => {
  const classes = useStyles({ numberOfChips: CHIPS_PER_ROW })

  const walletFiatSum = () => {
    return R.sum(R.map(it => it.fiatValue, wallets))
  }

  return (
    <div className={classes.totalAssetWrapper}>
      <div className={classes.totalAssetFieldWrapper}>
        <P className={classes.fieldHeader}>Available balance</P>
        <div className={classes.totalAssetWrapper}>
          <Info2 noMargin className={classes.fieldValue}>
            {balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </Info2>
          <Info2 noMargin className={classes.fieldCurrency}>
            {currency}
          </Info2>
        </div>
      </div>
      <Info2 className={classes.separator}>+</Info2>
      <div className={classes.totalAssetFieldWrapper}>
        <P className={classes.fieldHeader}>Total balance in wallets</P>
        <div className={classes.totalAssetWrapper}>
          <Info2 noMargin className={classes.fieldValue}>
            {walletFiatSum().toLocaleString('en-US', {
              maximumFractionDigits: 2
            })}
          </Info2>
          <Info2 noMargin className={classes.fieldCurrency}>
            {currency}
          </Info2>
        </div>
      </div>
      <Info2 className={classes.separator}>=</Info2>
      <div className={classes.totalAssetFieldWrapper}>
        <P className={classes.fieldHeader}>Total assets</P>
        <div className={classes.totalAssetWrapper}>
          <Info2 noMargin className={classes.fieldValue}>
            {balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </Info2>
          <Info2 noMargin className={classes.fieldCurrency}>
            {currency}
          </Info2>
        </div>
      </div>
    </div>
  )
}

const WalletInfoChip = ({ wallet, currency }) => {
  const classes = useStyles({ numberOfChips: CHIPS_PER_ROW })

  const getLogo = cryptoCode => {
    switch (cryptoCode) {
      case 'BTC':
        return <BitcoinLogo className={classes.btcLogo} />
      case 'ETH':
        return <EthereumLogo className={classes.ethLogo} />
      case 'LTC':
        return <LitecoinLogo className={classes.ltcLogo} />
      case 'ZEC':
        return <ZCashLogo className={classes.zecLogo} />
      case 'BCH':
        return <BitcoinCashLogo className={classes.bchLogo} />
      case 'DASH':
        return <DashLogo className={classes.dashLogo} />
      default:
        return <BitcoinLogo className={classes.btcLogo} />
    }
  }

  return (
    <div className={classes.walletChipWrapper}>
      <Paper className={classes.walletChip}>
        <div className={classes.walletHeader}>
          {getLogo(wallet.cryptoCode)}
          <Label3 className={classes.hedgedText}>
            {wallet.isHedged ? 'Hedged' : 'Not hedged'}
          </Label3>
        </div>
        <div className={classes.walletValueWrapper}>
          <Label2 className={classes.fieldHeader}>{wallet.name} value</Label2>
          <Label2 className={classes.walletValue}>
            {wallet.amount.toLocaleString('en-US', {
              maximumFractionDigits: 2
            })}{' '}
            {wallet.cryptoCode}
          </Label2>
          <Label2 className={classes.fieldHeader}>Hedged value</Label2>
          <Label2 className={classes.walletValue}>
            {wallet.fiatValue.toLocaleString('en-US', {
              maximumFractionDigits: 2
            })}{' '}
            {currency}
          </Label2>
        </div>
      </Paper>
    </div>
  )
}

const ATMWallet = () => {
  const classes = useStyles({ numberOfChips: CHIPS_PER_ROW })

  const wallets = [
    {
      cryptoCode: 'BTC',
      name: 'Bitcoin',
      amount: 2.7,
      fiatValue: 81452,
      isHedged: true
    },
    {
      cryptoCode: 'ETH',
      name: 'Ethereum',
      amount: 4.1,
      fiatValue: 4924,
      isHedged: true
    },
    {
      cryptoCode: 'LTC',
      name: 'Litecoin',
      amount: 15,
      fiatValue: 3016,
      isHedged: true
    },
    {
      cryptoCode: 'ZEC',
      name: 'Z-Cash',
      amount: 20,
      fiatValue: 2887,
      isHedged: false
    },
    {
      cryptoCode: 'BCH',
      name: 'Bitcoin Cash',
      amount: 10.7,
      fiatValue: 7074,
      isHedged: true
    },
    {
      cryptoCode: 'DASH',
      name: 'Dash',
      amount: 10.7,
      fiatValue: 1091,
      isHedged: false
    }
  ]

  return (
    <>
      <TitleSection title="ATM Wallets" />
      <Assets balance={8952} wallets={wallets} currency={'USD'} />
      <H3 className={classes.walletChipTitle}>ATM Wallets</H3>
      <div className={classes.walletChipList}>
        {R.map(
          it => (
            <WalletInfoChip wallet={it} currency={'USD'} />
          ),
          wallets
        )}
      </div>
    </>
  )
}

export default ATMWallet
