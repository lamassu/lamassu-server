import * as R from 'ramda'
import React from 'react'

import { schema as CommissionsSchema } from 'src/pages/Commissions/helper'
import { LocaleSchema } from 'src/pages/Locales/helper'
import { WalletSchema } from 'src/pages/Wallet/helper'
import { fromNamespace, namespaces } from 'src/utils/config'

import Commissions from './components/Commissions'
import Locale from './components/Locales'
// import Notifications from './components/Notifications'
// import WizardOperatorInfo from './components/OperatorInfo'
import Twilio from './components/Twilio'
import Wallet from './components/Wallet/Wallet'
import Welcome from './components/Welcome'

const getConfiguredCoins = (config, crypto) => {
  const wallet = fromNamespace(namespaces.WALLETS, config)
  return R.filter(it =>
    WalletSchema.isValidSync(fromNamespace(it.code, wallet))
  )(crypto)
}

const hasValidWallet = (config, crypto) => {
  const wallet = fromNamespace(namespaces.WALLETS, config)
  const coins = R.map(it => fromNamespace(it.code, wallet))(crypto)

  const hasValidConfig = R.compose(
    R.any(R.identity),
    R.map(it => WalletSchema.isValidSync(it))
  )(coins)

  return hasValidConfig
}

const hasValidLocale = config => {
  const locale = fromNamespace(namespaces.LOCALE, config)
  return LocaleSchema.isValidSync(locale)
}

const hasValidCommissions = config => {
  const commission = fromNamespace(namespaces.COMMISSIONS, config)
  return CommissionsSchema.isValidSync(commission)
}

const getWizardStep = (config, crypto) => {
  if (!config) return 0

  const validWallet = hasValidWallet(config, crypto)
  if (!validWallet) return 1

  const validLocale = hasValidLocale(config)
  if (!validLocale) return 2

  const validCommission = hasValidCommissions(config)
  if (!validCommission) return 3

  return 0
}

const STEPS = [
  {
    id: 'welcome',
    Component: Welcome
  },
  {
    id: 'wallet',
    Component: Wallet,
    exImage: '/assets/wizard/fullexample.wallet.png',
    subtitle: 'Wallet settings',
    text: `Your wallet settings are the first step for this wizard. 
    We'll start by setting up one of cryptocurrencies to get you up and running,
    but you can later set up as many as you want.`
  },
  {
    id: 'locale',
    Component: Locale,
    exImage: '/assets/wizard/fullexample.locale.png',
    subtitle: 'Locales',
    text: `From the Locales panel, you can define default settings
    that will be applied to all machines you add to your network later on.
    These settings may be overridden for specific machines in the Overrides section.`
  },
  {
    id: 'twilio',
    Component: Twilio,
    exImage: '/assets/wizard/fullexample.twilio.png',
    subtitle: 'Twilio (SMS service)',
    text: (
      <>
        Twilio is used for SMS operator notifications, phone number collection
        for compliance, and 1-confirmation redemptions on cash-out transactions.
        <br />
        You'll need to configure Twilio if you're offering cash-out or any
        compliance options
      </>
    )
  },
  {
    id: 'commissions',
    Component: Commissions,
    exImage: '/assets/wizard/fullexample.commissions.png',
    subtitle: 'Commissions',
    text: `From the Commissions page, you can define all the commissions of your
          machines. The values set here will be default values of all machines
          you'll later add to your network. Default settings keep you from
          having to enter the same values everytime you add a new machine. Once
          a machine is added, you may override these values per machine and per
          cryptocurrency in the overrides section.`
  }
  // {
  //   id: 'notifications',
  //   Component: Notifications,
  //   exImage: '/assets/wizard/fullexample.notifications.png',
  //   subtitle: 'Notifications',
  //   text: `Your notification settings will allow customize what notifications you
  //         get and where. You can later override all default balance alerts setup
  //         here.`
  // },
  // {
  //   id: 'operatorInfo',
  //   Component: WizardOperatorInfo,
  //   exImage: '/assets/wizard/fullexample.operatorinfo.png',
  //   subtitle: 'Operator info',
  //   text: `Your contact information is important for your customer to be able
  //         to contact you in case there’s a problem with one of your machines.
  //         In this page, you also be able to set up what you want to share with
  //         Coin ATM Radar and add the Terms & Services text that is displayed by your machines.`
  // }
]

export { getWizardStep, STEPS, getConfiguredCoins }
