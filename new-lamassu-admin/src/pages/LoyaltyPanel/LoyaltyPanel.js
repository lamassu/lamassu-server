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

import CouponCodes from './CouponCodes'
import IndividualDiscounts from './IndividualDiscounts'
import LoyaltyDiscounts from './LoyaltyDiscounts'

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
    key: 'individual-discounts',
    label: 'Individual Discounts',
    route: '/compliance/loyalty/individual-discounts',
    component: IndividualDiscounts
  },
  {
    key: 'loyalty-discounts',
    label: 'Loyalty Discounts',
    route: '/compliance/loyalty/discounts',
    component: LoyaltyDiscounts
  },
  {
    key: 'coupon-codes',
    label: 'Coupon Codes',
    route: '/compliance/loyalty/coupons',
    component: CouponCodes
  }
]

const Routes = ({ wizard }) => (
  <Switch>
    <Redirect
      exact
      from="/compliance/loyalty"
      to="/compliance/loyalty/individual-discounts"
    />
    <Route exact path="/" />
    {innerRoutes.map(({ route, component: Page, key }) => (
      <Route path={route} key={key}>
        <Page name={key} wizard={wizard} />
      </Route>
    ))}
  </Switch>
)

const LoyaltyPanel = ({ wizard = false }) => {
  const classes = useStyles()
  const history = useHistory()
  const location = useLocation()

  const isSelected = it => location.pathname === it.route

  const onClick = it => history.push(it.route)

  return (
    <>
      <TitleSection title="Loyalty Panel"></TitleSection>
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

export default LoyaltyPanel
