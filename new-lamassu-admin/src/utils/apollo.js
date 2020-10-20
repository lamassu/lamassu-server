import { ApolloProvider } from '@apollo/react-hooks'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloClient } from 'apollo-client'
import { ApolloLink } from 'apollo-link'
import { onError } from 'apollo-link-error'
import { HttpLink } from 'apollo-link-http'
import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'

const URI =
  process.env.NODE_ENV === 'development' ? 'https://localhost:8070' : ''

const getClient = (history, location) =>
  new ApolloClient({
    link: ApolloLink.from([
      onError(({ graphQLErrors, networkError }) => {
        if (graphQLErrors)
          graphQLErrors.forEach(({ message, locations, path, extensions }) => {
            if (extensions?.code === 'UNAUTHENTICATED') {
              if (location.pathname !== '/404') history.push('/404')
            }
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

const Provider = ({ children }) => {
  const history = useHistory()
  const location = useLocation()
  const client = getClient(history, location)
  return <ApolloProvider client={client}>{children}</ApolloProvider>
}

export default Provider
export { URI }
