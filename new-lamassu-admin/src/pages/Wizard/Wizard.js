import { useQuery } from '@apollo/react-hooks'
import { makeStyles, Dialog, DialogContent } from '@material-ui/core'
import classnames from 'classnames'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useReducer, useEffect } from 'react'
import { Switch, Route, useRouteMatch } from 'react-router-dom'

import Twilio from 'src/pages/Wizard/components/Twilio'
import { backgroundColor } from 'src/styling/variables'
import { fromNamespace, namespaces } from 'src/utils/config'

import { schema as CommissionsSchema } from '../Commissions/helper'
import { LocaleSchema } from '../Locales/helper'
import twilio from '../Services/schemas/twilio'
import { WalletSchema } from '../Wallet/helper'

import Commissions from './components/Commissions'
import Footer from './components/Footer'
import Locales from './components/Locales'
import N from './components/Notifications'
import WizardOperatorInfo from './components/OperatorInfo'
import Wallet from './components/Wallet'
import Welcome from './components/Welcome'

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    flexGrow: 1,
    padding: '1rem 0',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  welcomeBackground: {
    background: 'url(/wizard-background.svg) no-repeat center center fixed',
    backgroundSize: 'cover',
    backgroundColor: backgroundColor
  }
})

const GET_GLOBAL_CONFIG = gql`
  query getData {
    config
    accounts
  }
`
const validateSteps = ({ config, accounts }) => {
  const steps = [
    {
      namespace: 'welcome',
      isComplete: true
    },
    {
      namespace: namespaces.WALLETS,
      tag: 'Wallet settings',
      p: (
        <>
          Your wallet settings are the first step for this wizard. We'll start
          by setting one of cryptocurrency to get you up and running, but you
          can later setup as many cryptocurrencies as you want.
        </>
      ),
      isComplete: (() => {
        const wallets = fromNamespace(namespaces.WALLETS)(config)
        const wizardCoin = Object.keys(wallets).find(
          k => k.endsWith('_wizard') && wallets[k]
        )
        const coinCode = wizardCoin && wizardCoin.replace('_wizard', '')
        const wallet = coinCode && fromNamespace(coinCode)(wallets)
        return wallet && WalletSchema.isValidSync(wallet)
      })()
    },
    {
      namespace: namespaces.LOCALE,
      tag: 'Locales',
      p: (
        <>
          From the Locales page, you can define some important default settings
          of your machines. These values will be the default values of all
          machines you'll later add to your network. Default settings keep you
          from having to enther the same values everytime you add a new machine.
          Once a machine is added, you may override some of these values in the
          overrides section.
        </>
      ),
      isComplete: LocaleSchema.isValidSync(
        fromNamespace(namespaces.LOCALE)(config)
      )
    },
    {
      namespace: 'twilio',
      tag: 'Twilio (SMS service)',
      p: (
        <>
          Twilio is used for SMS operator notifications, phone number collection
          for compliance, and 1-confirmation redemptions on cash-out
          transactions.
          <br />
          You'll need to configure Twilio if you're offering cash-out or any
          compliance options
        </>
      ),
      isComplete:
        twilio.validationSchema.isValidSync(accounts?.twilio) ||
        R.isEmpty(accounts?.twilio)
    },
    {
      namespace: namespaces.COMMISSIONS,
      tag: 'Commissions',
      p: (
        <>
          From the Commissions page, you can define all the commissions of your
          machines. The values set here will be default values of all machines
          you'll later add to your network. Default settings keep you from
          having to enter the same values everytime you add a new machine. Once
          a machine is added, you may override these values per machine and per
          cryptocurrency in the overrides section.
        </>
      ),
      isComplete: CommissionsSchema.isValidSync(
        fromNamespace(namespaces.COMMISSIONS)(config)
      )
    },
    {
      namespace: namespaces.NOTIFICATIONS,
      tag: 'Notifications',
      p: (
        <>
          Your notification settings will allow customize what notifications you
          get and where. You can later override all default balance alerts setup
          here.
        </>
      ),
      isComplete: true
    },
    {
      namespace: namespaces.OPERATOR_INFO,
      tag: 'Operator info',
      p: <></>,
      isComplete: true
    }
  ]

  return steps
}

const findStepByName = namespace =>
  R.findIndex(R.propEq('namespace', namespace))

const getNextIndex = namespace => R.compose(R.add(1), findStepByName(namespace))

const initialState = {
  steps: [],
  current: 'welcome',
  next: namespaces.WALLETS
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'wizard/INIT':
      return { ...state, steps: validateSteps(action.payload) }
    case 'wizard/VALIDATE_STEP':
      return { ...state, steps: validateSteps(action.payload) }
    case 'wizard/SET_STEP':
      // eslint-disable-next-line no-case-declarations
      const nextIndex = getNextIndex(action.payload)(state.steps)
      // eslint-disable-next-line no-case-declarations
      const current = findStepByName(action.payload)(state.steps)

      return {
        ...state,
        ...state.steps[current],
        current: action.payload,
        next:
          state.steps[current].isComplete && state.steps[nextIndex]
            ? state.steps[nextIndex].namespace
            : null
      }

    default:
      return state
  }
}

function Wizard() {
  const { path } = useRouteMatch()

  const { data } = useQuery(GET_GLOBAL_CONFIG)
  const [state, dispatch] = useReducer(reducer, initialState)
  const { steps } = state

  useEffect(() => {
    data &&
      dispatch({
        type: 'wizard/INIT',
        payload: { config: data.config, accounts: data.accounts }
      })
  }, [data])

  const classes = useStyles()

  if (!steps || !steps.length) return <div></div>

  return (
    <Dialog fullScreen open={true}>
      <DialogContent
        className={classnames(
          classes.wrapper,
          state.current === 'welcome' && classes.welcomeBackground
        )}>
        <Switch>
          <Route exact path={path}>
            <Welcome
              // {...{ state, dispatch }}
              dispatch={dispatch}
            />
          </Route>

          <Route path={`${path}/${namespaces.WALLETS}`}>
            <Wallet
              {...{ state }}
              namespace={namespaces.WALLETS}
              dispatch={dispatch}
            />
          </Route>

          <Route path={`${path}/${namespaces.LOCALE}`}>
            <Locales
              {...{ state }}
              namespace={namespaces.LOCALE}
              dispatch={dispatch}
            />
          </Route>
          <Route path={`${path}/${namespaces.COMMISSIONS}`}>
            <Commissions
              {...{ state }}
              namespace={namespaces.COMMISSIONS}
              dispatch={dispatch}
            />
          </Route>
          <Route path={`${path}/twilio`}>
            <Twilio {...{ state }} namespace={'twilio'} dispatch={dispatch} />
          </Route>
          <Route path={`${path}/${namespaces.NOTIFICATIONS}`}>
            <N
              {...{ state }}
              namespace={namespaces.NOTIFICATIONS}
              dispatch={dispatch}
            />
          </Route>
          <Route path={`${path}/${namespaces.OPERATOR_INFO}`}>
            <WizardOperatorInfo
              {...{ state }}
              namespace={namespaces.OPERATOR_INFO}
              dispatch={dispatch}
            />
          </Route>
        </Switch>
      </DialogContent>
      {state.current !== 'welcome' && <Footer {...state} path={path}></Footer>}
    </Dialog>
  )
}

export default Wizard
