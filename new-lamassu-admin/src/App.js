import React from 'react'
import { create } from 'jss'
import { StylesProvider, jssPreset, MuiThemeProvider, makeStyles } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'
import { BrowserRouter as Router } from 'react-router-dom'
import extendJss from 'jss-plugin-extend'

import Header from './components/Header'
import { tree, Routes } from './routing/routes'

import theme from './styling/theme'
import global from './styling/global'
import { backgroundColor, mainWidth } from './styling/variables'

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

const App = () => {
  const classes = useStyles()

  return (
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
  )
}

export default App
