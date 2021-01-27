import CssBaseline from '@material-ui/core/CssBaseline'
import Grid from '@material-ui/core/Grid'
import {
  StylesProvider,
  jssPreset,
  MuiThemeProvider,
  makeStyles
} from '@material-ui/core/styles'
import { axios } from '@use-hooks/axios'
import { create } from 'jss'
import extendJss from 'jss-plugin-extend'
import React, { useContext, useEffect, useState } from 'react'
import {
  useLocation,
  useHistory,
  BrowserRouter as Router
} from 'react-router-dom'

import AppContext from 'src/AppContext'
import Header from 'src/components/layout/Header'
import Sidebar from 'src/components/layout/Sidebar'
import TitleSection from 'src/components/layout/TitleSection'
import ApolloProvider from 'src/pazuz/apollo/Provider'
import { tree, hasSidebar, Routes, getParent } from 'src/pazuz/routing/routes'
import global from 'src/styling/global'
import theme from 'src/styling/theme'
import { backgroundColor, mainWidth } from 'src/styling/variables'

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
  },
  grid: {
    flex: 1,
    height: '100%'
  },
  contentWithSidebar: {
    flex: 1,
    marginLeft: 48,
    paddingTop: 15
  },
  contentWithoutSidebar: {
    width: mainWidth
  }
})

const Main = () => {
  const classes = useStyles()
  const location = useLocation()
  const history = useHistory()
  const { wizardTested, userData } = useContext(AppContext)

  const route = location.pathname

  const sidebar = hasSidebar(route)
  const parent = sidebar ? getParent(route) : {}

  const is404 = location.pathname === '/404'

  const isSelected = it => location.pathname === it.route

  const onClick = it => history.push(it.route)

  const contentClassName = sidebar
    ? classes.contentWithSidebar
    : classes.contentWithoutSidebar

  return (
    <div className={classes.root}>
      {!is404 && wizardTested && userData && (
        <Header tree={tree} user={userData} />
      )}
      <main className={classes.wrapper}>
        {sidebar && !is404 && wizardTested && (
          <TitleSection title={parent.title}></TitleSection>
        )}

        <Grid container className={classes.grid}>
          {sidebar && !is404 && wizardTested && (
            <Sidebar
              data={parent.children}
              isSelected={isSelected}
              displayName={it => it.label}
              onClick={onClick}
            />
          )}
          <div className={contentClassName}>
            <Routes />
          </div>
        </Grid>
      </main>
    </div>
  )
}

const App = () => {
  const [wizardTested, setWizardTested] = useState(false)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  const url =
    process.env.NODE_ENV === 'development' ? 'https://localhost:8070' : ''

  useEffect(() => {
    axios({
      method: 'GET',
      url: `${url}/user-data`,
      withCredentials: true
    })
      .then(res => {
        setLoading(false)
        if (res.status === 200) setUserData(res.data.user)
      })
      .catch(err => {
        setLoading(false)
        if (err.status === 403) setUserData(null)
      })
  }, [url])

  return (
    <AppContext.Provider
      value={{ wizardTested, setWizardTested, userData, setUserData }}>
      {!loading && (
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
      )}
    </AppContext.Provider>
  )
}

export default App
