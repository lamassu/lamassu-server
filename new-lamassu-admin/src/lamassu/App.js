import { useQuery } from '@apollo/react-hooks'
import CssBaseline from '@material-ui/core/CssBaseline'
import Grid from '@material-ui/core/Grid'
import Slide from '@material-ui/core/Slide'
import {
  StylesProvider,
  jssPreset,
  MuiThemeProvider,
  makeStyles
} from '@material-ui/core/styles'
import gql from 'graphql-tag'
import { create } from 'jss'
import extendJss from 'jss-plugin-extend'
import React, { useContext, useState } from 'react'
import {
  useLocation,
  useHistory,
  BrowserRouter as Router
} from 'react-router-dom'

import AppContext from 'src/AppContext'
import Header from 'src/components/layout/Header'
import Sidebar from 'src/components/layout/Sidebar'
import TitleSection from 'src/components/layout/TitleSection'
import { tree, hasSidebar, Routes, getParent } from 'src/routing/routes'
import global from 'src/styling/global'
import theme from 'src/styling/theme'
import { backgroundColor, mainWidth } from 'src/styling/variables'
import ApolloProvider from 'src/utils/apollo'

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

const GET_USER_DATA = gql`
  query userData {
    userData {
      id
      username
      role
      enabled
      last_accessed
      last_accessed_from
      last_accessed_address
    }
  }
`

const Main = () => {
  const classes = useStyles()
  const location = useLocation()
  const history = useHistory()
  const { wizardTested, userData, setUserData } = useContext(AppContext)

  const { loading } = useQuery(GET_USER_DATA, {
    onCompleted: userResponse => {
      if (!userData && userResponse?.userData)
        setUserData(userResponse.userData)
    }
  })

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
          <div className={contentClassName}>{!loading && <Routes />}</div>
        </Grid>
      </main>
    </div>
  )
}

const App = () => {
  const [wizardTested, setWizardTested] = useState(false)
  const [userData, setUserData] = useState(null)

  const setRole = role => {
    if (userData && userData.role !== role) {
      setUserData({ ...userData, role })
    }
  }

  return (
    <AppContext.Provider
      value={{ wizardTested, setWizardTested, userData, setUserData, setRole }}>
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
