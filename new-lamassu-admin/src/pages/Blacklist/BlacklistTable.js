import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React from 'react'

import { IconButton } from 'src/components/buttons'
import DataTable from 'src/components/tables/DataTable'
import { Label1 } from 'src/components/typography'
import CopyToClipboard from 'src/pages/Transactions/CopyToClipboard'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'

import styles from './Blacklist.styles'

const useStyles = makeStyles(styles)

const BlacklistTable = ({ data, selectedCoin, handleDeleteEntry }) => {
  const classes = useStyles()

  const elements = [
    {
      name: 'address',
      header: <Label1 className={classes.white}>{'Addresses'}</Label1>,
      width: 800,
      textAlign: 'left',
      size: 'sm',
      view: it => (
        <div className={classes.addressRow}>
          <CopyToClipboard>{R.path(['address'], it)}</CopyToClipboard>
        </div>
      )
    },
    {
      name: 'deleteButton',
      header: <Label1 className={classes.white}>{'Delete'}</Label1>,
      width: 130,
      textAlign: 'center',
      size: 'sm',
      view: it => (
        <IconButton
          className={classes.deleteButton}
          onClick={() =>
            handleDeleteEntry(
              R.path(['cryptoCode'], it),
              R.path(['address'], it)
            )
          }>
          <DeleteIcon />
        </IconButton>
      )
    }
  ]
  const dataToShow = selectedCoin
    ? data[selectedCoin.code]
    : data[R.keys(data)[0]]

  return (
    <>
      <DataTable data={dataToShow} elements={elements} name="blacklistTable" />
    </>
  )
}

export default BlacklistTable
