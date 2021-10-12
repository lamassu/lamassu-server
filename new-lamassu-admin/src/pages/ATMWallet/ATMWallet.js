import { useQuery } from '@apollo/react-hooks'
import { Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useContext } from 'react'

import AppContext from 'src/AppContext'
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

const GET_OPERATOR_BY_USERNAME = gql`
  query operatorByUsername($username: String) {
    operatorByUsername(username: $username) {
      id
      entityId
      name
      fiatBalances
      cryptoBalances
      machines
      joined
      assetValue
      preferredFiatCurrency
      contactInfo {
        name
        email
      }
      fundings {
        id
        origin
        destination
        fiatAmount
        fiatBalanceAfter
        fiatCurrency
        created
        status
        description
      }
    }
  }
`

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
            {R.toUpper(currency)}
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
            {R.toUpper(currency)}
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
            {R.toUpper(currency)}
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
        return <BitcoinLogo className={classes.logo} />
      case 'ETH':
        return <EthereumLogo className={classes.logo} />
      case 'LTC':
        return <LitecoinLogo className={classes.logo} />
      case 'ZEC':
        return (
          <ZCashLogo className={classnames(classes.logo, classes.zecLogo)} />
        )
      case 'BCH':
        return (
          <BitcoinCashLogo
            className={classnames(classes.logo, classes.bchLogo)}
          />
        )
      case 'DASH':
        return <DashLogo className={classes.logo} />
      default:
        return <BitcoinLogo className={classes.logo} />
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
            {wallet.amount.toFixed(1).toLocaleString('en-US', {
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
  const { userData } = useContext(AppContext)

  const { data, loading } = useQuery(GET_OPERATOR_BY_USERNAME, {
    context: { clientName: 'pazuz' },
    variables: { username: userData?.username }
  })

  const operatorData = R.path(['operatorByUsername'], data)

  const wallets = [
    {
      cryptoCode: 'BTC',
      name: 'Bitcoin',
      amount: operatorData?.cryptoBalances.xbt ?? 0,
      fiatValue: 0,
      isHedged: true
    },
    {
      cryptoCode: 'ETH',
      name: 'Ethereum',
      amount: operatorData?.cryptoBalances.eth ?? 0,
      fiatValue: 0,
      isHedged: true
    },
    {
      cryptoCode: 'LTC',
      name: 'Litecoin',
      amount: operatorData?.cryptoBalances.ltc ?? 0,
      fiatValue: 0,
      isHedged: true
    },
    {
      cryptoCode: 'ZEC',
      name: 'Z-Cash',
      amount: operatorData?.cryptoBalances.zec ?? 0,
      fiatValue: 0,
      isHedged: false
    },
    {
      cryptoCode: 'BCH',
      name: 'Bitcoin Cash',
      amount: operatorData?.cryptoBalances.bch ?? 0,
      fiatValue: 0,
      isHedged: true
    },
    {
      cryptoCode: 'DASH',
      name: 'Dash',
      amount: operatorData?.cryptoBalances.dash ?? 0,
      fiatValue: 0,
      isHedged: false
    }
  ]

  return (
    !loading && (
      <>
        <TitleSection title="ATM Wallets" />
        <Assets
          balance={
            operatorData.fiatBalances[operatorData.preferredFiatCurrency]
          }
          wallets={wallets}
          currency={operatorData.preferredFiatCurrency}
        />
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
  )
}

export default ATMWallet
