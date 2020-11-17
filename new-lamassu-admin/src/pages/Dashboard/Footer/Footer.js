import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState, useEffect } from 'react'

import { Label1, Label2 } from 'src/components/typography'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'
import { white } from 'src/styling/variables'
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
  const [expanded, setExpanded] = useState(false)
  const [showExpandBtn, setShowExpandBtn] = useState(false)
  const [buttonName, setButtonName] = useState('Show all')
  const classes = useStyles()

  useEffect(() => {
    if (data && data.rates && data.rates.withCommissions) {
      const numItems = R.keys(data.rates.withCommissions).length
      if (numItems > 4) {
        setShowExpandBtn(true)
        setButtonName(`Show all (${numItems})`)
      }
    }
  }, [data])

  const toggleExpand = () => {
    if (expanded) {
      const numItems = R.keys(data.rates.withCommissions).length
      setExpanded(false)
      setButtonName(`Show all (${numItems})`)
    } else {
      setExpanded(true)
      setButtonName(`Show less`)
    }
  }

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

  const makeFooterExpandedClass = () => {
    return {
      overflow: 'scroll',
      // 88px for base height, then add 100 px for each row of items. Each row has 4 items. 5 items makes 2 rows so 288px of height
      height:
        88 + Math.ceil(R.keys(data.rates.withCommissions).length / 4) * 100,
      maxHeight: '50vh',
      position: 'fixed',
      left: 0,
      bottom: 0,
      width: '100vw',
      backgroundColor: white,
      textAlign: 'left',
      boxShadow: '0px -1px 10px 0px rgba(50, 50, 50, 0.1)'
    }
  }

  return (
    <>
      <div
        className={!expanded ? classes.footer : null}
        style={expanded ? makeFooterExpandedClass() : null}>
        <div className={classes.content}>
          {!loading && data && (
            <>
              <Grid container spacing={1}>
                <Grid container item xs={11} style={{ marginBottom: 18 }}>
                  {R.keys(data.rates.withCommissions).map(key =>
                    renderFooterItem(key)
                  )}
                </Grid>
                {/* {renderFooterItem(R.keys(data.rates.withCommissions)[0])} */}
                {showExpandBtn && (
                  <Label1
                    style={{
                      textAlign: 'center',
                      marginBottom: 0,
                      marginTop: 35
                    }}>
                    <Button
                      onClick={toggleExpand}
                      size="small"
                      disableRipple
                      disableFocusRipple
                      className={classes.button}>
                      {buttonName}
                    </Button>
                  </Label1>
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
