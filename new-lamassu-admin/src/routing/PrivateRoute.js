import React from 'react'
import { Route, Redirect } from 'react-router-dom'

const isAuthenticated = () => {
  return localStorage.getItem('loggedIn')
}

const PrivateRoute = ({ children, ...rest }) => {
  return (
    <Route
      {...rest}
      render={({ location }) =>
        isAuthenticated() ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: '/login'
            }}
          />
        )
      }
    />
  )
}

export default PrivateRoute
