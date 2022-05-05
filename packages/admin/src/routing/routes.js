import Fade from '@material-ui/core/Fade'
import Slide from '@material-ui/core/Slide'
import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React, { useContext } from 'react'
import {
  matchPath,
  Redirect,
  Switch,
  useHistory,
  useLocation
} from 'react-router-dom'

import AppContext from 'src/AppContext'
import Login from 'src/pages/Authentication/Login'
import Register from 'src/pages/Authentication/Register'
import Reset2FA from 'src/pages/Authentication/Reset2FA'
import ResetPassword from 'src/pages/Authentication/ResetPassword'
import Dashboard from 'src/pages/Dashboard'
import Machines from 'src/pages/Machines'
import Wizard from 'src/pages/Wizard'

import PrivateRoute from './PrivateRoute'
import PublicRoute from './PublicRoute'
import getLamassuRoutes from './lamassu.routes'
import getPazuzRoutes from './pazuz.routes'

const useStyles = makeStyles({
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  }
})

const getTree = () => {
  const buildTarget = process.env.REACT_APP_BUILD_TARGET

  if (buildTarget === 'LAMASSU') {
    return getLamassuRoutes()
  }

  if (buildTarget === 'PAZUZ') {
    return getPazuzRoutes()
  }
}

const tree = getTree()

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
      const keys = value.allowedRoles
      return R.includes(userData.role, keys)
    })
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
      <PrivateRoute exact path="/">
        <Redirect to={{ pathname: '/dashboard' }} />
      </PrivateRoute>
      <PrivateRoute path={'/dashboard'}>
        <Transition
          className={classes.wrapper}
          {...transitionProps}
          in={true}
          mountOnEnter
          unmountOnExit
          children={
            <div className={classes.wrapper}>
              <Dashboard />
            </div>
          }
        />
      </PrivateRoute>
      <PrivateRoute path="/machines" component={Machines} />
      <PrivateRoute path="/wizard" component={Wizard} />
      <PublicRoute path="/register" component={Register} />
      {/* <PublicRoute path="/configmigration" component={ConfigMigration} /> */}
      <PublicRoute path="/login" restricted component={Login} />
      <PublicRoute path="/resetpassword" component={ResetPassword} />
      <PublicRoute path="/reset2fa" component={Reset2FA} />
      {getFilteredRoutes().map(({ route, component: Page, key }) => (
        <PrivateRoute path={route} key={key}>
          <Transition
            className={classes.wrapper}
            {...transitionProps}
            in={!!matchPath(location.pathname, { path: route })}
            mountOnEnter
            unmountOnExit
            children={
              <div className={classes.wrapper}>
                <PrivateRoute path={route} key={key}>
                  <Page name={key} />
                </PrivateRoute>
              </div>
            }
          />
        </PrivateRoute>
      ))}
      <PublicRoute path="/404" />
      <PublicRoute path="*">
        <Redirect to={{ pathname: '/404' }} />
      </PublicRoute>
    </Switch>
  )
}
export { tree, getParent, hasSidebar, Routes }
