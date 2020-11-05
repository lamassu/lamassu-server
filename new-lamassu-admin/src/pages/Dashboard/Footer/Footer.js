import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'

import { Label2 } from 'src/components/typography'
import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'

import styles from './Footer.styles'

const GET_DATA = gql`
  query getData {
    rates
    cryptoCurrencies {
      code
      display
    }
    config
  }
`

const useStyles = makeStyles(styles)
const Footer = () => {
  const { data, loading } = useQuery(GET_DATA)

  const classes = useStyles()

  console.log(data, loading)

  const renderFooterItem = key => {
    const idx = R.findIndex(R.propEq('code', key))(data.cryptoCurrencies)
    return (
      <Grid key={key} item xs={3} style={{ marginBottom: 18 }}>
        <Label2 className={classes.label}>
          {data.cryptoCurrencies[idx].display}
        </Label2>
        <div className={classes.headerLabels}>
          <div>
            <TxInIcon />
            <span>{`${data.rates[key].cashIn} ${data.config.locale_fiatCurrency}`}</span>
          </div>
          <div>
            <TxOutIcon />
            <span>{`${data.rates[key].cashOut} ${data.config.locale_fiatCurrency}`}</span>
          </div>
        </div>
      </Grid>
    )
  }
  return (
    <>
      <div className={classes.footer}>
        <div className={classes.content}>
          {!loading && (
            <>
              <Grid container spacing={1}>
                {R.keys(data.rates).map(key => renderFooterItem(key))}
              </Grid>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Footer
