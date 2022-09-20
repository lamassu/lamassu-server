/* eslint-disable no-unused-vars */
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
import { fromNamespace, namespaces } from 'src/utils/config'

import styles from './Footer.styles'
const GET_DATA = gql`
  query getData {
    cryptoRates
    cryptoCurrencies {
      code
      display
    }
    localesConfig
    walletConfig
    accountsConfig {
      code
      display
    }
  }
`

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_HALF_UP })

const useStyles = makeStyles(styles)
const Footer = () => {
  const { data } = useQuery(GET_DATA)

  const withCommissions = R.path(['cryptoRates', 'withCommissions'])(data) ?? {}
  const classes = useStyles()
  const localesConfig = R.path(['localesConfig'])(data) ?? {}
  const walletConfig = R.path(['walletConfig'])(data) ?? {}
  const canExpand = R.keys(withCommissions).length > 4

  const wallets = fromNamespace(namespaces.WALLETS)(walletConfig)
  const cryptoCurrencies = R.path(['cryptoCurrencies'])(data) ?? []
  const accountsConfig = R.path(['accountsConfig'])(data) ?? []

  const localeFiatCurrency = fromNamespace(namespaces.LOCALE)(localesConfig)
    .fiatCurrency

  const renderFooterItem = key => {
    const idx = R.findIndex(R.propEq('code', key))(cryptoCurrencies)
    const tickerCode = wallets[`${key}_ticker`]
    const tickerIdx = R.findIndex(R.propEq('code', tickerCode))(accountsConfig)

    const tickerName = tickerIdx > -1 ? accountsConfig[tickerIdx].display : ''

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

    return (
      <Grid key={key} item xs={3}>
        <Label2 className={classes.label}>
          {cryptoCurrencies[idx].display}
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

  return (
    <div className={classes.footer1}>
      <div className={classes.content1}>
        <Grid container>
          <Grid container className={classes.footerContainer1}>
            {R.keys(withCommissions).map(key => renderFooterItem(key))}
          </Grid>
        </Grid>
      </div>
    </div>
  )
}

export default Footer
