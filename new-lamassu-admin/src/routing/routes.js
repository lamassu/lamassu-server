import * as R from 'ramda'
import React from 'react'
import { Route, Redirect, Switch } from 'react-router-dom'

import AuthRegister from 'src/pages/AuthRegister'
import Commissions from 'src/pages/Commissions'
import Customers from 'src/pages/Customers'
import Funding from 'src/pages/Funding'
import Locales from 'src/pages/Locales'
import MachineLogs from 'src/pages/MachineLogs'
import Notifications from 'src/pages/Notifications/Notifications'
import OperatorInfo from 'src/pages/OperatorInfo/OperatorInfo'
import ServerLogs from 'src/pages/ServerLogs'
import Services from 'src/pages/Services/Services'
import Transactions from 'src/pages/Transactions/Transactions'
import Triggers from 'src/pages/Triggers'
import WalletSettings from 'src/pages/Wallet/Wallet'
import MachineStatus from 'src/pages/maintenance/MachineStatus'
import { namespaces } from 'src/utils/config'

import Cashboxes from '../pages/maintenance/Cashboxes'

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
        key: 'logs',
        label: 'Logs',
        route: '/maintenance/logs',
        component: MachineLogs
      },
      {
        key: 'funding',
        label: 'Funding',
        route: '/maintenance/funding',
        component: Funding
      },
      {
        key: 'server-logs',
        label: 'Server',
        route: '/maintenance/server-logs',
        component: ServerLogs
      },
      {
        key: 'machine-status',
        label: 'Machine Status',
        route: '/maintenance/machine-status',
        component: MachineStatus
      },
      {
        key: 'cashboxes',
        label: 'Cashboxes',
        route: '/maintenance/cashboxes',
        component: Cashboxes
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
        label: 'Locale',
        route: '/settings/locale',
        component: Locales
      },
      {
        key: namespaces.SERVICES,
        label: '3rd party services',
        route: '/settings/3rd-party-services',
        component: Services
      },
      {
        key: namespaces.NOTIFICATIONS,
        label: 'Notifications',
        route: '/settings/notifications',
        component: Notifications
      },
      {
        key: namespaces.OPERATOR_INFO,
        label: 'Operator Info',
        route: '/settings/operator-info',
        component: OperatorInfo
      },
      {
        key: namespaces.WALLETS,
        label: 'Wallet',
        route: '/settings/wallet-settings',
        component: WalletSettings
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
      }
    ]
  }
]

const map = R.map(R.when(R.has('children'), R.prop('children')))
const leafRoutes = R.compose(R.flatten, map)(tree)
const parentRoutes = R.filter(R.has('children'))(tree)
const flattened = R.concat(leafRoutes, parentRoutes)

const Routes = () => (
  <Switch>
    <Route exact path="/" />
    <Route path="/register" component={AuthRegister} />
    {flattened.map(({ route, component: Page, key }) => (
      <Route path={route} key={key}>
        <Page name={key} />
      </Route>
    ))}
  </Switch>
)

export { tree, Routes }
