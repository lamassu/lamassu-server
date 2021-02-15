import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import BigNumber from 'bignumber.js'
import classnames from 'classnames'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import { Label2 } from 'src/components/typography'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { fromNamespace } from 'src/utils/config'

import styles from './Footer.styles'
const GET_DATA = gql`
  query getData {
    cryptoRates
    cryptoCurrencies {
      code
      display
    }
    config
    accountsConfig {
      code
      display
    }
  }
`
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_HALF_UP })

const useStyles = makeStyles(styles)
const Footer = () => {
  const { data, loading } = useQuery(GET_DATA)
  const [expanded, setExpanded] = useState(false)
  const [delayedExpand, setDelayedExpand] = useState(null)

  const classes = useStyles({
    bigFooter: R.keys(data?.cryptoRates?.withCommissions).length < 8,
    expanded
  })

  const canExpand = R.keys(data?.cryptoRates.withCommissions ?? []).length > 4

  const wallets = fromNamespace('wallets')(data?.config)

  const renderFooterItem = key => {
    const idx = R.findIndex(R.propEq('code', key))(data.cryptoCurrencies)
    const tickerCode = wallets[`${key}_ticker`]
    const tickerIdx = R.findIndex(R.propEq('code', tickerCode))(
      data.accountsConfig
    )

    const tickerName = data.accountsConfig[tickerIdx].display

    const cashInNoCommission = parseFloat(
      R.path(['cryptoRates', 'withoutCommissions', key, 'cashIn'])(data)
    )
    const cashOutNoCommission = parseFloat(
      R.path(['cryptoRates', 'withoutCommissions', key, 'cashOut'])(data)
    )

    const avgOfAskBid = new BigNumber(
      (cashInNoCommission + cashOutNoCommission) / 2
    ).toFormat(2)
    const cashIn = new BigNumber(
      parseFloat(
        R.path(['cryptoRates', 'withCommissions', key, 'cashIn'])(data)
      )
    ).toFormat(2)
    const cashOut = new BigNumber(
      parseFloat(
        R.path(['cryptoRates', 'withCommissions', key, 'cashOut'])(data)
      )
    ).toFormat(2)

    const localeFiatCurrency = data.config.locale_fiatCurrency

    return (
      <Grid key={key} item xs={3} className={classes.footerItemContainer}>
        <Label2 className={classes.label}>
          {data.cryptoCurrencies[idx].display}
        </Label2>
        <div className={classes.headerLabels}>
          <div className={classes.headerLabel}>
            <TxInIcon />
            <Label2>{` ${cashIn} ${localeFiatCurrency}`}</Label2>
          </div>
          <div className={classnames(classes.headerLabel, classes.txOutMargin)}>
            <TxOutIcon />
            <Label2>{` ${cashOut} ${localeFiatCurrency}`}</Label2>
          </div>
        </div>
        <Label2
          className={
            classes.tickerLabel
          }>{`${tickerName}: ${avgOfAskBid} ${localeFiatCurrency}`}</Label2>
      </Grid>
    )
  }

  const handleMouseEnter = () => {
    setDelayedExpand(setTimeout(() => canExpand && setExpanded(true), 300))
  }

  const handleMouseLeave = () => {
    clearTimeout(delayedExpand)
    setExpanded(false)
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={classes.footer}>
      <div className={classes.content}>
        {!loading && data && (
          <Grid container spacing={1}>
            <Grid container className={classes.footerContainer}>
              {R.keys(data.cryptoRates.withCommissions).map(key =>
                renderFooterItem(key)
              )}
            </Grid>
          </Grid>
        )}
      </div>
    </div>
  )
}

export default Footer
