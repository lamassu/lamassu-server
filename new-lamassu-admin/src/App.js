import CssBaseline from '@material-ui/core/CssBaseline'
import {
  StylesProvider,
  jssPreset,
  MuiThemeProvider,
  makeStyles,
} from '@material-ui/core/styles'
import { setAutoFreeze } from 'immer'
import { create } from 'jss'
import extendJss from 'jss-plugin-extend'
import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import ApolloClient from 'apollo-boost'
import { ApolloProvider } from '@apollo/react-hooks'

import Header from './components/Header'
import { tree, Routes } from './routing/routes'
import global from './styling/global'
import theme from './styling/theme'
import { backgroundColor, mainWidth } from './styling/variables'

const client = new ApolloClient({
  credentials: 'include',
  uri:
    process.env.NODE_ENV === 'development'
      ? 'https://localhost:8070/graphql/'
      : '/graphql',
})

if (process.env.NODE_ENV !== 'production') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render')
  whyDidYouRender(React, { include: [/Logs/] })
}

// disable immer autofreeze for performance
setAutoFreeze(false)

const jss = create({
  plugins: [extendJss(), ...jssPreset().plugins],
})

const fill = '100%'
const flexDirection = 'column'

const useStyles = makeStyles({
  ...global,
  root: {
    backgroundColor,
    width: fill,
    minHeight: fill,
    display: 'flex',
    flexDirection,
  },
  wrapper: {
    width: mainWidth,
    height: fill,
    margin: '0 auto',
    flex: 1,
    display: 'flex',
    flexDirection,
  },
})

const App = () => {
  const classes = useStyles()

  return (
    <ApolloProvider client={client}>
      <StylesProvider jss={jss}>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <div className={classes.root}>
            <Router>
              <Header tree={tree} />
              <main className={classes.wrapper}>
                <Routes />
              </main>
            </Router>
          </div>
        </MuiThemeProvider>
      </StylesProvider>
    </ApolloProvider>
  )
}

export default App
