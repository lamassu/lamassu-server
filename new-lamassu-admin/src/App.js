import { ApolloProvider, useQuery } from '@apollo/react-hooks'
import CssBaseline from '@material-ui/core/CssBaseline'
import {
  StylesProvider,
  jssPreset,
  MuiThemeProvider,
  makeStyles
} from '@material-ui/core/styles'
import gql from 'graphql-tag'
import { create } from 'jss'
import extendJss from 'jss-plugin-extend'
import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'

import Wizard from 'src/pages/Wizard'
import { getWizardStep } from 'src/pages/Wizard/helper'
import client from 'src/utils/apollo'

import Header from './components/layout/Header'
import { tree, Routes } from './routing/routes'
import global from './styling/global'
import theme from './styling/theme'
import { backgroundColor, mainWidth } from './styling/variables'

if (process.env.NODE_ENV !== 'production') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render')
  whyDidYouRender(React)
}

const jss = create({
  plugins: [extendJss(), ...jssPreset().plugins]
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
    flexDirection
  },
  wrapper: {
    width: mainWidth,
    height: fill,
    margin: '0 auto',
    flex: 1,
    display: 'flex',
    flexDirection
  }
})

const GET_DATA = gql`
  query getData {
    config
    accounts
    cryptoCurrencies {
      code
      display
    }
  }
`

const Main = () => {
  const classes = useStyles()
  const { data, loading } = useQuery(GET_DATA, {
    notifyOnNetworkStatusChange: true
  })

  if (loading) {
    return <></>
  }

  const wizardStep = getWizardStep(data?.config, data?.cryptoCurrencies)

  return (
    <div className={classes.root}>
      <Router>
        {wizardStep && <Wizard wizardStep={wizardStep} />}
        <Header tree={tree} />
        <main className={classes.wrapper}>
          <Routes />
        </main>
      </Router>
    </div>
  )
}

const App = () => {
  return (
    <ApolloProvider client={client}>
      <StylesProvider jss={jss}>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <Main />
        </MuiThemeProvider>
      </StylesProvider>
    </ApolloProvider>
  )
}

export default App
