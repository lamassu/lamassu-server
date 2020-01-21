import * as R from 'ramda'
import React from 'react'
import { Route, Redirect, Switch } from 'react-router-dom'

import Commissions from 'src/pages/Commissions'
import Funding from 'src/pages/Funding'
import Locales from 'src/pages/Locales'
import Logs from 'src/pages/Logs'
import ServerLogs from 'src/pages/ServerLogs'
import Transactions from 'src/pages/Transactions/Transactions'
import Services from 'src/pages/Services/Services'
import AuthRegister from 'src/pages/AuthRegister'
import OperatorInfo from 'src/pages/OperatorInfo/OperatorInfo'
import Notifications from 'src/pages/Notifications/Notifications'

import MachineStatus from '../pages/maintenance/MachineStatus'

const tree = [
  { key: 'transactions', label: 'Transactions', route: '/transactions' },
  // maintenence: { label: 'Maintenence', children: [{ label: 'Locale', route: '/locale' }] },
  // analytics: { label: 'Analytics', children: [{ label: 'Locale', route: '/locale' }] },
  {
    key: 'maintenance',
    label: 'Maintenance',
    route: '/maintenance',
    children: [
      { key: 'logs', label: 'Logs', route: '/maintenance/logs' },
      { key: 'fuding', label: 'Funding', route: '/maintenance/funding' },
      {
        key: 'server-logs',
        label: 'Server',
        route: '/maintenance/server-logs'
      },
      {
        key: 'machine-status',
        label: 'Machine Status',
        route: '/maintenance/machine-status'
      }
    ]
  },
  {
    key: 'settings',
    label: 'Settings',
    route: '/settings',
    children: [
      {
        key: 'commissions',
        label: 'Commissions',
        route: '/settings/commissions'
      },
      { key: 'locale', label: 'Locale', route: '/settings/locale' },
      {
        key: 'services',
        label: '3rd party services',
        route: '/settings/3rd-party-services'
      },
      {
        key: 'notifications',
        label: 'Notifications',
        route: '/settings/notifications'
      },
      { key: 'info', label: 'Operator Info', route: '/settings/operator-info' }
    ]
  }
  // compliance: { label: 'Compliance', children: [{ label: 'Locale', route: '/locale' }] }
]

const firstChild = key => {
  const getRoute = R.path(['children', 0, 'route'])
  const withKey = R.find(R.propEq('key', key))
  return R.compose(getRoute, withKey)(tree)
}

const Routes = () => (
  <Switch>
    <Route exact path="/" />
    <Route
      path="/settings"
      exact
      component={() => <Redirect to={firstChild('settings')} />}
    />
    <Route
      path="/maintenance"
      exact
      component={() => <Redirect to={firstChild('maintenance')} />}
    />
    <Route path="/settings/commissions" component={Commissions} />
    <Route path="/settings/locale" component={Locales} />
    <Route path="/settings/3rd-party-services" component={Services} />
    <Route path="/settings/notifications" component={Notifications} />
    <Route path="/settings/operator-info" component={OperatorInfo} />
    <Route path="/maintenance/logs" component={Logs} />
    <Route path="/maintenance/funding" component={Funding} />
    <Route path="/maintenance/server-logs" component={ServerLogs} />
    <Route path="/transactions" component={Transactions} />
    <Route path="/register" component={AuthRegister} />
    <Route path="/maintenance/machine-status" component={MachineStatus} />
  </Switch>
)

export { tree, Routes }
