import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core/styles'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState, memo } from 'react'

import { BooleanPropertiesTable } from 'src/components/booleanPropertiesTable'
import { Switch } from 'src/components/inputs'
import { H4, P, Label2 } from 'src/components/typography'
import { fromNamespace, toNamespace, namespaces } from 'src/utils/config'

import { mainStyles } from './ReceiptPrinting.styles'

const useStyles = makeStyles(mainStyles)

const initialValues = {
  active: 'off',
  operatorWebsite: false,
  operatorEmail: false,
  operatorPhone: false,
  companyNumber: false,
  machineLocation: false,
  customerNameOrPhoneNumber: false,
  exchangeRate: false,
  addressQRCode: false
}

const GET_CONFIG = gql`
  {
    config
  }
`

const SAVE_CONFIG = gql`
  mutation Save($config: JSONObject) {
    saveConfig(config: $config)
  }
`

const ReceiptPrinting = memo(({ wizard }) => {
  const [receiptPrintingConfig, setReceiptPrintingConfig] = useState(null)

  const classes = useStyles()

  const { refetch: getReceiptPrintingConfig } = useQuery(GET_CONFIG, {
    onCompleted: configResponse => {
      const response = fromNamespace(namespaces.RECEIPT, configResponse.config)
      const values = R.merge(initialValues, response)
      setReceiptPrintingConfig(values)
    }
  })

  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: configResponse => {
      setReceiptPrintingConfig(
        fromNamespace(namespaces.RECEIPT, configResponse.saveConfig)
      )

      getReceiptPrintingConfig()
    }
  })

  const save = it =>
    saveConfig({
      variables: { config: toNamespace(namespaces.RECEIPT, it) }
    })

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
            display: 'Operator website',
            value: receiptPrintingConfig.operatorWebsite
          },
          {
            name: 'operatorEmail',
            display: 'Operator email',
            value: receiptPrintingConfig.operatorEmail
          },
          {
            name: 'operatorPhone',
            display: 'Operator phone',
            value: receiptPrintingConfig.operatorPhone
          },
          {
            name: 'companyNumber',
            display: 'Company number',
            value: receiptPrintingConfig.companyNumber
          },
          {
            name: 'machineLocation',
            display: 'Machine location',
            value: receiptPrintingConfig.machineLocation
          },
          {
            name: 'customerNameOrPhoneNumber',
            display: 'Customer name or phone number (if known)',
            value: receiptPrintingConfig.customerNameOrPhoneNumber
          },
          {
            name: 'exchangeRate',
            display: 'Exchange rate',
            value: receiptPrintingConfig.exchangeRate
          },
          {
            name: 'addressQRCode',
            display: 'Address QR code',
            value: receiptPrintingConfig.addressQRCode
          }
        ]}
        save={save}
      />
    </>
  )
})

export default ReceiptPrinting
