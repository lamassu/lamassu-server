import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React from 'react'

import TitleSection from 'src/components/layout/TitleSection'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'

import styles from './Dashboard.styles'
import Footer from './Footer'
import LeftSide from './LeftSide'
import RightSide from './RightSide'
const useStyles = makeStyles(styles)

const Dashboard = () => {
  const classes = useStyles()

  return (
    <>
      <TitleSection title="Dashboard">
        <div className={classes.headerLabels}>
          <div
            className={classnames(
              classes.headerLabelContainer,
              classes.headerLabelContainerMargin
            )}>
            <TxOutIcon />
            <span className={classes.headerLabelSpan}>Cash-out</span>
          </div>
          <div className={classes.headerLabelContainer}>
            <TxInIcon />
            <span className={classes.headerLabelSpan}>Cash-in</span>
          </div>
        </div>
      </TitleSection>
      <div className={classes.root}>
        <Grid container>
          <LeftSide />
          <RightSide />
        </Grid>
      </div>
      <Footer />
    </>
  )
}

export default Dashboard
