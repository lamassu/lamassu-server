import CssBaseline from '@material-ui/core/CssBaseline'
import Grid from '@material-ui/core/Grid'
import Slide from '@material-ui/core/Slide'
import {
  StylesProvider,
  jssPreset,
  MuiThemeProvider,
  makeStyles
} from '@material-ui/core/styles'
import { create } from 'jss'
import extendJss from 'jss-plugin-extend'
import React, { useContext, useState } from 'react'
import {
  useLocation,
  useHistory,
  BrowserRouter as Router
} from 'react-router-dom'

import AppContext from 'src/AppContext'
import Sidebar from 'src/components/layout/Sidebar'
import TitleSection from 'src/components/layout/TitleSection'
import ApolloProvider from 'src/utils/apollo'

import Header from '../components/layout/Header'
import { tree, hasSidebar, Routes, getParent } from '../routing/routes'
import global from '../styling/global'
import theme from '../styling/theme'
import { backgroundColor, mainWidth } from '../styling/variables'

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
  const { wizardTested } = useContext(AppContext)

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
      {!is404 && wizardTested && <Header tree={tree} />}
      <main className={classes.wrapper}>
        {sidebar && !is404 && wizardTested && (
          <Slide
            direction="left"
            in={true}
            mountOnEnter
            unmountOnExit
            children={
              <div>
                <TitleSection title={parent.title}></TitleSection>
              </div>
            }
          />
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
