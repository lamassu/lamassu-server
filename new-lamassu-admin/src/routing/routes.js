import React from 'react'
import { compose, get, keyBy } from 'lodash/fp'
import { Route, Redirect, Switch } from 'react-router-dom'

import Commissions from '../pages/Commissions'
import Logs from '../pages/Logs'
import Locales from '../pages/Locales'
import Funding from '../pages/Funding'
import ServerLogs from '../pages/ServerLogs'

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
      { key: 'server-logs', label: 'Server', route: '/maintenance/server-logs' }
    ]
  },
  {
    key: 'settings',
    label: 'Settings',
    route: '/settings',
    children: [
      { key: 'commissions', label: 'Commissions', route: '/settings/commissions' },
      { key: 'locale', label: 'Locale', route: '/settings/locale' }
    ]
  }
  // compliance: { label: 'Compliance', children: [{ label: 'Locale', route: '/locale' }] }
]

const firstChild = key => {
  const response = compose(
    get(`${key}.children[0].route`),
    keyBy('key')
  )(tree)

  return response
}

const Routes = () => (
  <Switch>
    <Route exact path='/' />
    <Route
      path='/settings'
      exact
      component={() => <Redirect to={firstChild('settings')} />}
    />
    <Route
      path='/maintenance'
      exact
      component={() => <Redirect to={firstChild('maintenance')} />}
    />
    <Route path='/settings/commissions' component={Commissions} />
    <Route path='/settings/locale' component={Locales} />
    <Route path='/maintenance/logs' component={Logs} />
    <Route path='/maintenance/funding' component={Funding} />
    <Route path='/maintenance/server-logs' component={ServerLogs} />
  </Switch>
)

export { tree, Routes }
