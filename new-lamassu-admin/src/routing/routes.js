import * as R from 'ramda'
import React, { useContext } from 'react'
import {
  Route,
  Redirect,
  Switch,
  useHistory,
  useLocation
} from 'react-router-dom'

import { AppContext } from 'src/App'
// import AuthRegister from 'src/pages/AuthRegister'
import Login from 'src/pages/Authentication/Login'
import Register from 'src/pages/Authentication/Register'
import Reset2FA from 'src/pages/Authentication/Reset2FA'
import ResetPassword from 'src/pages/Authentication/ResetPassword'
import Blacklist from 'src/pages/Blacklist'
import Cashout from 'src/pages/Cashout'
import Commissions from 'src/pages/Commissions'
import { Customers, CustomerProfile } from 'src/pages/Customers'
import Funding from 'src/pages/Funding'
import Locales from 'src/pages/Locales'
import MachineLogs from 'src/pages/MachineLogs'
import CashCassettes from 'src/pages/Maintenance/CashCassettes'
import MachineStatus from 'src/pages/Maintenance/MachineStatus'
import Notifications from 'src/pages/Notifications/Notifications'
import CoinAtmRadar from 'src/pages/OperatorInfo/CoinATMRadar'
import ContactInfo from 'src/pages/OperatorInfo/ContactInfo'
import ReceiptPrinting from 'src/pages/OperatorInfo/ReceiptPrinting'
import TermsConditions from 'src/pages/OperatorInfo/TermsConditions'
import ServerLogs from 'src/pages/ServerLogs'
import Services from 'src/pages/Services/Services'
import SessionManagement from 'src/pages/SessionManagement/SessionManagement'
import Transactions from 'src/pages/Transactions/Transactions'
import Triggers from 'src/pages/Triggers'
import UserManagement from 'src/pages/UserManagement/UserManagement'
import WalletSettings from 'src/pages/Wallet/Wallet'
import Wizard from 'src/pages/Wizard'
import { namespaces } from 'src/utils/config'

import PrivateRoute from './PrivateRoute'
import PublicRoute from './PublicRoute'
import { ROLES } from './utils'

const tree = [
  {
    key: 'transactions',
    label: 'Transactions',
    route: '/transactions',
    allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
    component: Transactions
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    route: '/maintenance',
    allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
    get component() {
      return () => <Redirect to={this.children[0].route} />
    },
    children: [
      {
        key: 'cash_cassettes',
        label: 'Cash Cassettes',
        route: '/maintenance/cash-cassettes',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: CashCassettes
      },
      {
        key: 'funding',
        label: 'Funding',
        route: '/maintenance/funding',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Funding
      },
      {
        key: 'logs',
        label: 'Machine Logs',
        route: '/maintenance/logs',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: MachineLogs
      },
      {
        key: 'machine-status',
        label: 'Machine Status',
        route: '/maintenance/machine-status',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: MachineStatus
      },
      {
        key: 'server-logs',
        label: 'Server',
        route: '/maintenance/server-logs',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: ServerLogs
      }
    ]
  },
  {
    key: 'settings',
    label: 'Settings',
    route: '/settings',
    allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
    get component() {
      return () => <Redirect to={this.children[0].route} />
    },
    children: [
      {
        key: namespaces.COMMISSIONS,
        label: 'Commissions',
        route: '/settings/commissions',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Commissions
      },
      {
        key: namespaces.LOCALE,
        label: 'Locales',
        route: '/settings/locale',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Locales
      },
      {
        key: namespaces.CASH_OUT,
        label: 'Cash-out',
        route: '/settings/cash-out',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Cashout
      },
      {
        key: namespaces.NOTIFICATIONS,
        label: 'Notifications',
        route: '/settings/notifications',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Notifications
      },
      {
        key: 'services',
        label: '3rd party services',
        route: '/settings/3rd-party-services',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Services
      },
      {
        key: namespaces.WALLETS,
        label: 'Wallet',
        route: '/settings/wallet-settings',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: WalletSettings
      },
      {
        key: namespaces.OPERATOR_INFO,
        label: 'Operator Info',
        route: '/settings/operator-info',
        title: 'Operator Information',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        get component() {
          return () => <Redirect to={this.children[0].route} />
        },
        children: [
          {
            key: 'contact-info',
            label: 'Contact information',
            route: '/settings/operator-info/contact-info',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: ContactInfo
          },
          {
            key: 'receipt-printing',
            label: 'Receipt',
            route: '/settings/operator-info/receipt-printing',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: ReceiptPrinting
          },
          {
            key: 'coin-atm-radar',
            label: 'Coin ATM Radar',
            route: '/settings/operator-info/coin-atm-radar',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
            component: CoinAtmRadar
          },
          {
            key: 'terms-conditions',
            label: 'Terms & Conditions',
            route: '/settings/operator-info/terms-conditions',
            allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
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
    allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
    get component() {
      return () => <Redirect to={this.children[0].route} />
    },
    children: [
      {
        key: 'triggers',
        label: 'Triggers',
        route: '/compliance/triggers',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Triggers
      },
      {
        key: 'customers',
        label: 'Customers',
        route: '/compliance/customers',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Customers
      },
      {
        key: 'blacklist',
        label: 'Blacklist',
        route: '/compliance/blacklist',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: Blacklist
      },
      {
        key: 'customer',
        route: '/compliance/customer/:id',
        allowedRoles: [ROLES.USER, ROLES.SUPERUSER],
        component: CustomerProfile
      }
    ]
  },
  {
    key: 'system',
    label: 'System',
    route: '/system',
    allowedRoles: [ROLES.SUPERUSER],
    get component() {
      return () => <Redirect to={this.children[0].route} />
    },
    children: [
      {
        key: 'user-management',
        label: 'User Management',
        route: '/system/user-management',
        allowedRoles: [ROLES.SUPERUSER],
        component: UserManagement
      },
      {
        key: 'session-management',
        label: 'Session Management',
        route: '/system/session-management',
        allowedRoles: [ROLES.SUPERUSER],
        component: SessionManagement
      }
    ]
  }
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
  const history = useHistory()
  const location = useLocation()
  const { wizardTested, userData } = useContext(AppContext)

  const dontTriggerPages = [
    '/404',
    '/register',
    '/wizard',
    '/login',
    '/register',
    '/resetpassword',
    '/reset2fa'
  ]

  if (!wizardTested && !R.contains(location.pathname)(dontTriggerPages)) {
    history.push('/wizard')
    return null
  }

  const getFilteredRoutes = () => {
    if (!userData) return []

    return flattened.filter(value => {
      const keys = value.allowedRoles.map(v => {
        return v.key
      })
      return R.includes(userData.role, keys)
    })
  }

  return (
    <Switch>
      <PrivateRoute exact path="/">
        <Redirect to={{ pathname: '/transactions' }} />
      </PrivateRoute>
      <PrivateRoute path="/wizard" component={Wizard} />
      <Route path="/register" component={Register} />
      <PublicRoute path="/login" restricted component={Login} />
      <Route path="/resetpassword" component={ResetPassword} />
      <Route path="/reset2fa" component={Reset2FA} />
      {getFilteredRoutes().map(({ route, component: Page, key }) => (
        <PrivateRoute path={route} key={key}>
          <Page name={key} />
        </PrivateRoute>
      ))}
      <Route path="/404" />
      <Route path="*">
        <Redirect to={{ pathname: '/404' }} />
      </Route>
    </Switch>
  )
}
export { tree, getParent, hasSidebar, Routes }
