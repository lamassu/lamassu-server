import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import React from 'react'
import {
  Route,
  Switch,
  Redirect,
  useLocation,
  useHistory
} from 'react-router-dom'

import Sidebar from 'src/components/layout/Sidebar'
import TitleSection from 'src/components/layout/TitleSection'

import CoinAtmRadar from './CoinATMRadar'
import ContactInfo from './ContactInfo'
import ReceiptPrinting from './ReceiptPrinting'
import TermsConditions from './TermsConditions'

const styles = {
  grid: {
    flex: 1,
    height: '100%'
  },
  content: {
    flex: 1,
    marginLeft: 48,
    paddingTop: 15
  }
}

const useStyles = makeStyles(styles)

const innerRoutes = [
  {
    label: 'Contact information',
    route: '/settings/operator-info/contact-info',
    component: ContactInfo
  },
  {
    label: 'Receipt',
    route: '/settings/operator-info/receipt-printing',
    component: ReceiptPrinting
  },
  {
    label: 'Coin ATM Radar',
    route: '/settings/operator-info/coin-atm-radar',
    component: CoinAtmRadar
  },
  {
    label: 'Terms & Conditions',
    route: '/settings/operator-info/terms-conditions',
    component: TermsConditions
  }
]

const Routes = ({ wizard }) => (
  <Switch>
    <Redirect
      exact
      from="/settings/operator-info"
      to="/settings/operator-info/contact-info"
    />
    <Route exact path="/" />
    {innerRoutes.map(({ route, component: Page, key }) => (
      <Route path={route} key={key}>
        <Page name={key} wizard={wizard} />
      </Route>
    ))}
  </Switch>
)

const OperatorInfo = ({ wizard = false }) => {
  const classes = useStyles()
  const history = useHistory()
  const location = useLocation()

  const isSelected = it => location.pathname === it.route

  const onClick = it => history.push(it.route)

  return (
    <>
      <TitleSection title="Operator information"></TitleSection>
      <Grid container className={classes.grid}>
        <Sidebar
          data={innerRoutes}
          isSelected={isSelected}
          displayName={it => it.label}
          onClick={onClick}
        />
        <div className={classes.content}>
          <Routes wizard={wizard} />
        </div>
      </Grid>
    </>
  )
}

export default OperatorInfo
