import React, { useContext } from 'react'
import { Route, Redirect } from 'react-router-dom'

import AppContext from 'src/AppContext'

import { isLoggedIn } from './utils'

const PublicRoute = ({ component: Component, restricted, ...rest }) => {
  const { userData } = useContext(AppContext)

  return (
    <Route
      {...rest}
      render={props =>
        isLoggedIn(userData) && restricted ? (
          <Redirect to="/" />
        ) : (
          <Component {...props} />
        )
      }
    />
  )
}

export default PublicRoute
