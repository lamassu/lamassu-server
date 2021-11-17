import { useQuery } from '@apollo/react-hooks'
import Grid from '@material-ui/core/Grid'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import { makeStyles, withStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useContext } from 'react'

import AppContext from 'src/AppContext'
import TitleSection from 'src/components/layout/TitleSection'
import { H4, Label2, P, Info2 } from 'src/components/typography'

import styles from './Assets.styles'
const useStyles = makeStyles(styles)

const GET_OPERATOR_BY_USERNAME = gql`
  query operatorByUsername($username: String) {
    operatorByUsername(username: $username) {
      id
      entityId
      name
      fiatBalances
      cryptoBalances
      machines
      joined
      assetValue
      preferredFiatCurrency
      contactInfo {
        name
        email
      }
      fundings {
        id
        origin
        destination
        fiatAmount
        fiatBalanceAfter
        fiatCurrency
        created
        status
        description
      }
    }
  }
`

const cellStyling = {
  borderBottom: '4px solid white',
  padding: 0,
  paddingLeft: 20,
  paddingRight: 20
}

const Cell = withStyles({
  root: cellStyling
})(TableCell)

const HeaderCell = withStyles({
  root: {
    ...cellStyling,
    backgroundColor: 'white'
  }
})(TableCell)

const AssetsAmountTable = ({ title, data = [], numToRender }) => {
  const classes = useStyles()

  const totalAmount = R.compose(R.sum, R.map(R.path(['amount'])))(data) ?? 0
  const currency = data[0]?.currency ?? ''
  const selectAmountPrefix = it =>
    it.direction === 'in' ? '+' : R.isNil(it.direction) ? '' : '-'

  return (
    <>
      <Grid item className={classes.card} xs={12}>
        <H4 className={classes.h4}>{title}</H4>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <HeaderCell>
                  <div className={classes.asset}>
                    <Label2 className={classes.label}>Asset</Label2>
                  </div>
                </HeaderCell>
                <HeaderCell>
                  <div className={classes.amount}>
                    <Label2 className={classes.label}>Amount</Label2>
                  </div>
                </HeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.map((asset, idx) => {
                if (!(idx < numToRender)) return <></>
                return (
                  <TableRow className={classes.row} key={idx}>
                    <Cell align="left">
                      <P>{asset.display}</P>
                    </Cell>
                    <Cell align="right">
                      <P>{`${selectAmountPrefix(asset)}
                         ${formatCurrency(Math.abs(asset.amount))} ${
                        asset.currency
                      }`}</P>
                    </Cell>
                  </TableRow>
                )
              })}
              <TableRow className={classes.totalRow} key={data?.length + 1}>
                <Cell align="left">
                  <Info2>{`Total ${R.toLower(title)}`}</Info2>
                </Cell>
                <Cell align="right">
                  <Info2>{`${formatCurrency(totalAmount)} ${currency}`}</Info2>
                </Cell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </>
  )
}

const formatCurrency = amount =>
  amount.toLocaleString('en-US', { maximumFractionDigits: 2 })

const Assets = () => {
  const classes = useStyles()
  const { userData } = useContext(AppContext)

  const { data, loading } = useQuery(GET_OPERATOR_BY_USERNAME, {
    context: { clientName: 'pazuz' },
    variables: { username: userData?.username }
  })

  const operatorData = R.path(['operatorByUsername'], data)

  const balanceData = [
    {
      id: 'fiatBalance',
      display: 'Fiat balance',
      amount:
        operatorData?.fiatBalances[operatorData?.preferredFiatCurrency] ?? 0,
      currency: R.toUpper(operatorData?.preferredFiatCurrency ?? ''),
      class: 'Available balance'
    },
    {
      id: 'hedgingReserve',
      display: 'Hedging reserve',
      amount:
        operatorData?.fiatBalances[operatorData?.preferredFiatCurrency] ?? 0,
      currency: R.toUpper(operatorData?.preferredFiatCurrency ?? ''),
      class: 'Available balance',
      direction: 'out'
    }
  ]

  const walletData = [
    {
      id: 'hedgedWalletAssets',
      display: 'Hedged wallet assets',
      amount: 0,
      currency: R.toUpper(operatorData?.preferredFiatCurrency ?? ''),
      class: 'Wallet assets',
      direction: 'in'
    },
    {
      id: 'unhedgedWalletAssets',
      display: 'Unhedged wallet assets',
      amount: 0,
      currency: R.toUpper(operatorData?.preferredFiatCurrency ?? ''),
      class: 'Wallet assets',
      direction: 'in'
    }
  ]

  const totalData = [
    {
      id: 'fiatBalance',
      display: 'Fiat balance',
      amount:
        operatorData?.fiatBalances[operatorData?.preferredFiatCurrency] ?? 0,
      currency: R.toUpper(operatorData?.preferredFiatCurrency ?? '')
    },
    {
      id: 'hedgingReserve',
      display: 'Hedging reserve',
      amount: 0,
      currency: R.toUpper(operatorData?.preferredFiatCurrency ?? ''),
      direction: 'out'
    },
    {
      id: 'hedgedWalletAssets',
      display: 'Market value of hedged wallet assets',
      amount: 0,
      currency: R.toUpper(operatorData?.preferredFiatCurrency ?? ''),
      direction: 'in'
    },
    {
      id: 'unhedgedWalletAssets',
      display: 'Unhedged wallet assets',
      amount: 0,
      currency: R.toUpper(operatorData?.preferredFiatCurrency ?? ''),
      direction: 'in'
    }
  ]

  return (
    !loading && (
      <>
        <TitleSection title="Balance sheet" />
        <div className={classes.root}>
          <Grid container>
            <Grid container direction="column" item xs={5}>
              <Grid item xs={12}>
                <div className={classes.leftSide}>
                  <AssetsAmountTable
                    title="Available balance"
                    data={balanceData}
                    numToRender={balanceData.length}
                  />
                </div>
                <div className={classes.leftSide}>
                  <AssetsAmountTable
                    title="Wallet assets"
                    data={walletData}
                    numToRender={walletData.length}
                  />
                </div>
              </Grid>
            </Grid>
            <Grid container direction="column" item xs={7}>
              <Grid item xs={12}>
                <div className={classes.rightSide}>
                  <AssetsAmountTable
                    title="Total assets"
                    data={totalData}
                    numToRender={totalData.length}
                  />
                </div>
              </Grid>
            </Grid>
          </Grid>
        </div>
      </>
    )
  )
}

export default Assets
