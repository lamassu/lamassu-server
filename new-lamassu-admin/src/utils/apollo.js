import { ApolloProvider } from '@apollo/react-hooks'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloClient } from 'apollo-client'
import { ApolloLink } from 'apollo-link'
import { onError } from 'apollo-link-error'
import { HttpLink } from 'apollo-link-http'
import React, { useContext } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import AppContext from 'src/AppContext'

const URI =
  process.env.NODE_ENV === 'development' ? 'https://localhost:8070' : ''

const getClient = (history, location, getUserData, setUserData, setRole) =>
  new ApolloClient({
    link: ApolloLink.from([
      onError(({ graphQLErrors, networkError }) => {
        if (graphQLErrors)
          graphQLErrors.forEach(({ message, locations, path, extensions }) => {
            if (extensions?.code === 'UNAUTHENTICATED') {
              setUserData(null)
              if (location.pathname !== '/login') history.push('/login')
            }
            console.log(
              `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
            )
          })
        if (networkError) console.log(`[Network error]: ${networkError}`)
      }),
      new ApolloLink((operation, forward) => {
        return forward(operation).map(response => {
          const context = operation.getContext()
          const {
            response: { headers }
          } = context

          if (headers) {
            const role = headers.get('lamassu_role')
            setRole(role)
          }

          return response
        })
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

const Provider = ({ children }) => {
  const history = useHistory()
  const location = useLocation()
  const { userData, setUserData, setRole } = useContext(AppContext)
  const client = getClient(
    history,
    location,
    () => userData,
    setUserData,
    setRole
  )

  return <ApolloProvider client={client}>{children}</ApolloProvider>
}

export default Provider
export { URI }
