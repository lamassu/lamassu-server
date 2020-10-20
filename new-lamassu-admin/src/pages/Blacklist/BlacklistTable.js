import { Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import * as R from 'ramda'
import React from 'react'

import Tooltip from 'src/components/Tooltip'
import { IconButton } from 'src/components/buttons'
import { Switch } from 'src/components/inputs'
import DataTable from 'src/components/tables/DataTable'
import { H4, Label1, Label2, P } from 'src/components/typography'
import CopyToClipboard from 'src/pages/Transactions/CopyToClipboard'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import { fromNamespace, toNamespace } from 'src/utils/config'

import styles from './Blacklist.styles'
const useStyles = makeStyles(styles)

const BlacklistTable = ({
  data,
  selectedCoin,
  handleDeleteEntry,
  saveConfig,
  configData
}) => {
  const complianceConfig =
    configData?.config && fromNamespace('compliance')(configData.config)
  const rejectAddressReuse = complianceConfig?.rejectAddressReuse ?? false
  const addressReuseSave = rawConfig => {
    const config = toNamespace('compliance')(rawConfig)
    return saveConfig({ variables: { config } })
  }

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
      <Box display="flex" justifyContent="space-between" mb={3}>
        <H4 noMargin className={classes.subtitle}>
          {selectedCoin.display
            ? `${selectedCoin.display} blacklisted addresses`
            : ''}{' '}
        </H4>
        <Box display="flex" alignItems="center" justifyContent="end" mr="-5px">
          <P>Reject reused addresses</P>
          <Switch
            checked={rejectAddressReuse}
            onChange={event => {
              addressReuseSave({ rejectAddressReuse: event.target.checked })
            }}
            value={rejectAddressReuse}
          />
          <Label2>{rejectAddressReuse ? 'On' : 'Off'}</Label2>
          <Tooltip width={304}>
            <P>
              The "Reject reused addresses" option means that all addresses that
              are used once will be automatically rejected if there's an attempt
              to use them again on a new transaction.
            </P>
          </Tooltip>
        </Box>
      </Box>
      <DataTable data={dataToShow} elements={elements} name="blacklistTable" />
    </>
  )
}

export default BlacklistTable
