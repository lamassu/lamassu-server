import { ApolloProvider } from '@apollo/react-hooks'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloClient } from 'apollo-client'
import { ApolloLink } from 'apollo-link'
import { onError } from 'apollo-link-error'
import { HttpLink } from 'apollo-link-http'
import * as R from 'ramda'
import React, { useContext } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import AppContext from 'src/AppContext'

const URI =
  process.env.NODE_ENV === 'development' ? 'https://localhost:8070' : ''

const getClient = (history, location, setUserData) =>
  new ApolloClient({
    link: ApolloLink.from([
      onError(({ graphQLErrors, networkError }) => {
        if (graphQLErrors)
          graphQLErrors.forEach(({ message, locations, path, extensions }) => {
            handle(extensions?.code, history, location, setUserData)
            console.log(
              `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
            )
          })
        if (networkError) console.log(`[Network error]: ${networkError}`)
      }),
      new HttpLink({
        credentials: 'include',
        uri: `${URI}/graphql`
      })
    ]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'ignore'
      },
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      },
      mutate: {
        errorPolicy: 'all'
      }
    }
  })

const handle = (type, ...args) => {
  const handler = {
    UNAUTHENTICATED: ({ history, location, setUserData }) => {
      setUserData(null)
      if (location.pathname !== '/login') history.push('/login')
    },
    INVALID_CREDENTIALS: () => {},
    INVALID_TWO_FACTOR_CODE: () => {},
    INVALID_URL_TOKEN: () => {},
    USER_ALREADY_EXISTS: () => {}
  }

  if (!R.has(type, handler)) throw new Error('Unknown error code.')

  return handler[type](...args)
}

const Provider = ({ children }) => {
  const history = useHistory()
  const location = useLocation()
  const { setUserData } = useContext(AppContext)
  const client = getClient(history, location, setUserData)

  return <ApolloProvider client={client}>{children}</ApolloProvider>
}

export default Provider
export { URI }
