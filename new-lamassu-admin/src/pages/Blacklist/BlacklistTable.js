import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React, { useState } from 'react'

import { DeleteDialog } from 'src/components/DeleteDialog'
import { IconButton } from 'src/components/buttons'
import DataTable from 'src/components/tables/DataTable'
import { Label1 } from 'src/components/typography'
import CopyToClipboard from 'src/pages/Transactions/CopyToClipboard'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'

import styles from './Blacklist.styles'

const useStyles = makeStyles(styles)

const BlacklistTable = ({
  data,
  selectedCoin,
  handleDeleteEntry,
  errorMessage,
  setErrorMessage,
  deleteDialog,
  setDeleteDialog
}) => {
  const classes = useStyles()

  const [toBeDeleted, setToBeDeleted] = useState()

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
          onClick={() => {
            setDeleteDialog(true)
            setToBeDeleted(it)
          }}>
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
      <DataTable
        data={dataToShow}
        elements={elements}
        emptyText="No blacklisted addresses so far"
        name="blacklistTable"
      />
      <DeleteDialog
        open={deleteDialog}
        onDismissed={() => {
          setDeleteDialog(false)
          setErrorMessage(null)
        }}
        onConfirmed={() => {
          setErrorMessage(null)
          handleDeleteEntry(
            R.path(['cryptoCode'], toBeDeleted),
            R.path(['address'], toBeDeleted)
          )
        }}
        errorMessage={errorMessage}
      />
    </>
  )
}

export default BlacklistTable
