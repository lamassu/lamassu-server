import CssBaseline from '@material-ui/core/CssBaseline'
import {
  StylesProvider,
  jssPreset,
  MuiThemeProvider,
  makeStyles
} from '@material-ui/core/styles'
import { create } from 'jss'
import extendJss from 'jss-plugin-extend'
import React, { createContext, useState } from 'react'
import { useLocation, BrowserRouter as Router } from 'react-router-dom'

import ApolloProvider from 'src/utils/apollo'

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

const AppContext = createContext()

const Main = () => {
  const classes = useStyles()
  const location = useLocation()

  const is404 = location.pathname === '/404'

  return (
    <div className={classes.root}>
      {!is404 && <Header tree={tree} />}
      <main className={classes.wrapper}>
        <Routes />
      </main>
    </div>
  )
}

const App = () => {
  const [wizardTested, setWizardTested] = useState(false)

  return (
    <AppContext.Provider value={{ wizardTested, setWizardTested }}>
      <Router>
        <ApolloProvider>
          <StylesProvider jss={jss}>
            <MuiThemeProvider theme={theme}>
              <CssBaseline />
              <Main />
            </MuiThemeProvider>
          </StylesProvider>
        </ApolloProvider>
      </Router>
    </AppContext.Provider>
  )
}

export default App
export { AppContext }
