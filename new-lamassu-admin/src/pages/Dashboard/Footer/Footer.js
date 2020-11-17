import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'

import { Label2 } from 'src/components/typography'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { fromNamespace } from 'src/utils/config'

import styles from './Footer.styles'
const GET_DATA = gql`
  query getData {
    rates
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

const useStyles = makeStyles(styles)
const Footer = () => {
  const { data, loading } = useQuery(GET_DATA)

  const classes = useStyles()
  const wallets = fromNamespace('wallets')(data?.config)

  const renderFooterItem = key => {
    const idx = R.findIndex(R.propEq('code', key))(data.cryptoCurrencies)
    const tickerCode = wallets[`${key}_ticker`]
    const tickerIdx = R.findIndex(R.propEq('code', tickerCode))(
      data.accountsConfig
    )

    const tickerName = data.accountsConfig[tickerIdx].display

    const cashInNoCommission = parseFloat(
      R.path(['rates', 'withoutCommissions', key, 'cashIn'])(data)
    )
    const cashOutNoCommission = parseFloat(
      R.path(['rates', 'withoutCommissions', key, 'cashOut'])(data)
    )

    // check https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
    // to see reason for this implementation. It makes 1.005 round to 1.01 and not 1
    // const monetaryValue = +(Math.round(askBidAvg + 'e+2') + 'e-2')
    const avgOfAskBid = +(
      Math.round((cashInNoCommission + cashOutNoCommission) / 2 + 'e+2') + 'e-2'
    )
    const cashIn = +(
      Math.round(
        parseFloat(R.path(['rates', 'withCommissions', key, 'cashIn'])(data)) +
          'e+2'
      ) + 'e-2'
    )
    const cashOut = +(
      Math.round(
        parseFloat(R.path(['rates', 'withCommissions', key, 'cashOut'])(data)) +
          'e+2'
      ) + 'e-2'
    )

    const localeFiatCurrency = data.config.locale_fiatCurrency

    return (
      <Grid key={key} item xs={3} style={{ marginBottom: 18 }}>
        <Label2 className={classes.label}>
          {data.cryptoCurrencies[idx].display}
        </Label2>
        <div className={classes.headerLabels}>
          <div>
            <TxInIcon />
            <Label2>{` ${cashIn.toLocaleString(
              'en-US'
            )} ${localeFiatCurrency}`}</Label2>
          </div>
          <div>
            <TxOutIcon />
            <Label2>{` ${cashOut.toLocaleString(
              'en-US'
            )} ${localeFiatCurrency}`}</Label2>
          </div>
        </div>
        <Label2
          className={
            classes.tickerLabel
          }>{`${tickerName}: ${avgOfAskBid.toLocaleString(
          'en-US'
        )} ${localeFiatCurrency}`}</Label2>
      </Grid>
    )
  }

  return (
    <>
      <div className={classes.footer}>
        <div className={classes.content}>
          {!loading && data && (
            <>
              <Grid container spacing={1}>
                {R.keys(data.rates.withCommissions).map(key =>
                  renderFooterItem(key)
                )}
              </Grid>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Footer
