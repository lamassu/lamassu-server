import React, { useContext } from 'react'
import { Route, Redirect } from 'react-router-dom'

import AppContext from 'src/AppContext'

import { isLoggedIn } from './utils'

const PrivateRoute = ({ ...rest }) => {
  const { userData } = useContext(AppContext)

  return isLoggedIn(userData) ? <Route {...rest} /> : <Redirect to="/login" />
}

export default PrivateRoute
