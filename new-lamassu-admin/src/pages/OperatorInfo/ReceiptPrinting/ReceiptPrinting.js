import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { memo } from 'react'

import { BooleanPropertiesTable } from 'src/components/booleanPropertiesTable'
import { Switch } from 'src/components/inputs'
import { H4, P, Label2 } from 'src/components/typography'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import { mainStyles } from './ReceiptPrinting.styles'

const useStyles = makeStyles(mainStyles)

const GET_CONFIG = gql`
  query getData {
    config
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const ReceiptPrinting = memo(({ wizard }) => {
  const classes = useStyles()

  const { data } = useQuery(GET_CONFIG)

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    refetchQueries: () => ['getData']
  })

  const save = it =>
    saveConfig({
      variables: { config: toNamespace(namespaces.RECEIPT, it) }
    })

  const receiptPrintingConfig =
    data?.config && fromNamespace(namespaces.RECEIPT, data.config)
  if (!receiptPrintingConfig) return null

  return (
    <>
      <div className={classes.rowWrapper}>
        <H4>Receipt options</H4>
      </div>
      <div className={classes.rowWrapper}>
        <P>Share information?</P>
        <div className={classes.switchWrapper}>
          <Switch
            checked={receiptPrintingConfig.active}
            onChange={event =>
              saveConfig({
                variables: {
                  config: toNamespace(
                    namespaces.RECEIPT,
                    R.merge(receiptPrintingConfig, {
                      active: event.target.checked
                    })
                  )
                }
              })
            }
          />
        </div>
        <Label2>{receiptPrintingConfig.active ? 'Yes' : 'No'}</Label2>
      </div>
      <BooleanPropertiesTable
        editing={wizard}
        title={'Visible on the receipt (optionals)'}
        data={receiptPrintingConfig}
        elements={[
          {
            name: 'operatorWebsite',
            display: 'Operator website'
          },
          {
            name: 'operatorEmail',
            display: 'Operator email'
          },
          {
            name: 'operatorPhone',
            display: 'Operator phone'
          },
          {
            name: 'companyNumber',
            display: 'Company number'
          },
          {
            name: 'machineLocation',
            display: 'Machine location'
          },
          {
            name: 'customerNameOrPhoneNumber',
            display: 'Customer name or phone number (if known)'
          },
          {
            name: 'exchangeRate',
            display: 'Exchange rate'
          },
          {
            name: 'addressQRCode',
            display: 'Address QR code'
          }
        ]}
        save={save}
      />
    </>
  )
})

export default ReceiptPrinting
