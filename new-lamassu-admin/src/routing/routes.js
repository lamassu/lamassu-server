import Fade from '@material-ui/core/Fade'
import Slide from '@material-ui/core/Slide'
import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React, { useContext } from 'react'
import {
  matchPath,
  Route,
  Redirect,
  Switch,
  useHistory,
  useLocation
} from 'react-router-dom'

import { AppContext } from 'src/App'
import AuthRegister from 'src/pages/AuthRegister'
import Blacklist from 'src/pages/Blacklist'
import Cashout from 'src/pages/Cashout'
import Commissions from 'src/pages/Commissions'
import ConfigMigration from 'src/pages/ConfigMigration'
import { Customers, CustomerProfile } from 'src/pages/Customers'
import Dashboard from 'src/pages/Dashboard'
import Funding from 'src/pages/Funding'
import Locales from 'src/pages/Locales'
import Coupons from 'src/pages/LoyaltyPanel/CouponCodes'
import MachineLogs from 'src/pages/MachineLogs'
import Machines from 'src/pages/Machines'
import CashCassettes from 'src/pages/Maintenance/CashCassettes'
import MachineStatus from 'src/pages/Maintenance/MachineStatus'
import Notifications from 'src/pages/Notifications/Notifications'
import CoinAtmRadar from 'src/pages/OperatorInfo/CoinATMRadar'
import ContactInfo from 'src/pages/OperatorInfo/ContactInfo'
import ReceiptPrinting from 'src/pages/OperatorInfo/ReceiptPrinting'
import TermsConditions from 'src/pages/OperatorInfo/TermsConditions'
import ServerLogs from 'src/pages/ServerLogs'
import Services from 'src/pages/Services/Services'
// import TokenManagement from 'src/pages/TokenManagement/TokenManagement'
import Transactions from 'src/pages/Transactions/Transactions'
import Triggers from 'src/pages/Triggers'
import WalletSettings from 'src/pages/Wallet/Wallet'
import Wizard from 'src/pages/Wizard'
import { namespaces } from 'src/utils/config'

const useStyles = makeStyles({
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  }
})

const tree = [
  {
    key: 'transactions',
    label: 'Transactions',
    route: '/transactions',
    component: Transactions
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    route: '/maintenance',
    get component() {
      return () => <Redirect to={this.children[0].route} />
    },
    children: [
      {
        key: 'cash_cassettes',
        label: 'Cash Cassettes',
        route: '/maintenance/cash-cassettes',
        component: CashCassettes
      },
      {
        key: 'funding',
        label: 'Funding',
        route: '/maintenance/funding',
        component: Funding
      },
      {
        key: 'logs',
        label: 'Machine Logs',
        route: '/maintenance/logs',
        component: MachineLogs
      },
      {
        key: 'machine-status',
        label: 'Machine Status',
        route: '/maintenance/machine-status',
        component: MachineStatus
      },
      {
        key: 'server-logs',
        label: 'Server',
        route: '/maintenance/server-logs',
        component: ServerLogs
      }
    ]
  },
  {
    key: 'settings',
    label: 'Settings',
    route: '/settings',
    get component() {
      return () => <Redirect to={this.children[0].route} />
    },
    children: [
      {
        key: namespaces.COMMISSIONS,
        label: 'Commissions',
        route: '/settings/commissions',
        component: Commissions
      },
      {
        key: namespaces.LOCALE,
        label: 'Locales',
        route: '/settings/locale',
        component: Locales
      },
      {
        key: namespaces.CASH_OUT,
        label: 'Cash-out',
        route: '/settings/cash-out',
        component: Cashout
      },
      {
        key: namespaces.NOTIFICATIONS,
        label: 'Notifications',
        route: '/settings/notifications',
        component: Notifications
      },
      {
        key: 'services',
        label: '3rd party services',
        route: '/settings/3rd-party-services',
        component: Services
      },
      {
        key: namespaces.WALLETS,
        label: 'Wallet',
        route: '/settings/wallet-settings',
        component: WalletSettings
      },
      {
        key: namespaces.OPERATOR_INFO,
        label: 'Operator Info',
        route: '/settings/operator-info',
        title: 'Operator Information',
        get component() {
          return () => (
            <Redirect
              to={{
                pathname: this.children[0].route,
                state: { prev: this.state?.prev }
              }}
            />
          )
        },
        children: [
          {
            key: 'contact-info',
            label: 'Contact information',
            route: '/settings/operator-info/contact-info',
            component: ContactInfo
          },
          {
            key: 'receipt-printing',
            label: 'Receipt',
            route: '/settings/operator-info/receipt-printing',
            component: ReceiptPrinting
          },
          {
            key: 'coin-atm-radar',
            label: 'Coin ATM Radar',
            route: '/settings/operator-info/coin-atm-radar',
            component: CoinAtmRadar
          },
          {
            key: 'terms-conditions',
            label: 'Terms & Conditions',
            route: '/settings/operator-info/terms-conditions',
            component: TermsConditions
          }
        ]
      }
    ]
  },
  {
    key: 'compliance',
    label: 'Compliance',
    route: '/compliance',
    get component() {
      return () => <Redirect to={this.children[0].route} />
    },
    children: [
      {
        key: 'triggers',
        label: 'Triggers',
        route: '/compliance/triggers',
        component: Triggers
      },
      {
        key: 'customers',
        label: 'Customers',
        route: '/compliance/customers',
        component: Customers
      },
      {
        key: 'blacklist',
        label: 'Blacklist',
        route: '/compliance/blacklist',
        component: Blacklist
      },
      {
        key: 'discount-coupons',
        label: 'Discount Coupons',
        route: '/compliance/loyalty/coupons',
        component: Coupons
      },
      {
        key: 'customer',
        route: '/compliance/customer/:id',
        component: CustomerProfile
      }
    ]
  }
  // {
  //   key: 'system',
  //   label: 'System',
  //   route: '/system',
  //   get component() {
  //     return () => <Redirect to={this.children[0].route} />
  //   },
  //   children: [
  //     {
  //       key: 'token-management',
  //       label: 'Token Management',
  //       route: '/system/token-management',
  //       component: TokenManagement
  //     }
  //   ]
  // }
]

const map = R.map(R.when(R.has('children'), R.prop('children')))
const mappedRoutes = R.compose(R.flatten, map)(tree)
const parentRoutes = R.filter(R.has('children'))(mappedRoutes).concat(
  R.filter(R.has('children'))(tree)
)
const leafRoutes = R.compose(R.flatten, map)(mappedRoutes)

const flattened = R.concat(leafRoutes, parentRoutes)

const hasSidebar = route =>
  R.any(r => r.route === route)(
    R.compose(
      R.flatten,
      R.map(R.prop('children')),
      R.filter(R.has('children'))
    )(mappedRoutes)
  )

const getParent = route =>
  R.find(
    R.propEq(
      'route',
      R.dropLast(
        1,
        R.dropLastWhile(x => x !== '/', route)
      )
    )
  )(flattened)

const Routes = () => {
  const classes = useStyles()

  const history = useHistory()
  const location = useLocation()

  const { wizardTested } = useContext(AppContext)

  const dontTriggerPages = ['/404', '/register', '/wizard']

  if (!wizardTested && !R.contains(location.pathname)(dontTriggerPages)) {
    history.push('/wizard')
  }

  const Transition = location.state ? Slide : Fade

  const transitionProps =
    Transition === Slide
      ? {
          direction:
            R.findIndex(R.propEq('route', location.state.prev))(leafRoutes) >
            R.findIndex(R.propEq('route', location.pathname))(leafRoutes)
              ? 'right'
              : 'left'
        }
      : { timeout: 400 }

  return (
    <Switch>
      <Route exact path="/">
        <Redirect to={{ pathname: '/transactions' }} />
      </Route>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/machines" component={Machines} />
      <Route path="/wizard" component={Wizard} />
      <Route path="/register" component={AuthRegister} />
      <Route path="/configmigration" component={ConfigMigration} />
      {flattened.map(({ route, component: Page, key }) => (
        <Route path={route} key={key}>
          <Transition
            className={classes.wrapper}
            {...transitionProps}
            in={!!matchPath(location.pathname, { path: route })}
            mountOnEnter
            unmountOnExit
            children={
              <div className={classes.wrapper}>
                <Page name={key} />
              </div>
            }
          />
        </Route>
      ))}
      <Route path="/404" />
      <Route path="*">
        <Redirect to={{ pathname: '/404' }} />
      </Route>
    </Switch>
  )
}
export { tree, getParent, hasSidebar, Routes }
