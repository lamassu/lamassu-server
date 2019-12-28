// import { makeStyles } from '@material-ui/core/styles'
import React, { useState, memo } from 'react'
import { useQuery, useMutation } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'

import { EditableProperty } from 'src/components/editableProperty'
import { BooleanPropertiesTable } from 'src/components/booleanPropertiesTable'
// import { ActionButton } from 'src/components/buttons'
// import { ReactComponent as UploadIcon } from 'src/styling/icons/button/upload/zodiac.svg'
// import { ReactComponent as UploadIconInverse } from 'src/styling/icons/button/upload/white.svg'
// import { TextInput } from 'src/components/inputs'

// import { mainStyles } from './ReceiptPrinting.styles'

// const useStyles = makeStyles(mainStyles)

const initialValues = {
  active: 'off',
  // logo: false,
  operatorWebsite: false,
  operatorEmail: false,
  operatorPhone: false,
  companyRegistration: false,
  machineLocation: false,
  customerNameOrPhoneNumber: false,
  // commission: false,
  exchangeRate: false,
  addressQRCode: false
  // customText: false,
  // customTextContent: ''
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

const receiptPrintingOptions = [
  {
    value: 'off',
    display: 'Off'
  },
  {
    value: 'optional',
    display: 'Optional (ask user)'
  },
  {
    value: 'on',
    display: 'On'
  }
]

const ReceiptPrinting = memo(() => {
  const [receiptPrintingConfig, setReceiptPrintingConfig] = useState(null)

  // const classes = useStyles()

  // TODO: treat errors on useMutation and useQuery
  const [saveConfig] = useMutation(SAVE_CONFIG, {
    onCompleted: configResponse =>
      setReceiptPrintingConfig(configResponse.saveConfig.receiptPrinting)
  })
  useQuery(GET_CONFIG, {
    onCompleted: configResponse => {
      setReceiptPrintingConfig(
        configResponse?.config?.receiptPrinting ?? initialValues
      )
    }
  })

  const save = it =>
    saveConfig({ variables: { config: { receiptPrinting: it } } })

  if (!receiptPrintingConfig) return null

  return (
    <>
      <EditableProperty
        title={'Receipt options'}
        prefixText={'Receipt printing'}
        disabled={false}
        options={receiptPrintingOptions}
        value={receiptPrintingConfig.active}
        save={it =>
          saveConfig({
            variables: { config: { receiptPrinting: { active: it } } }
          })
        }
      />
      <BooleanPropertiesTable
        title={'Visible on the receipt (optionals)'}
        disabled={receiptPrintingConfig.active === 'off'}
        data={receiptPrintingConfig}
        elements={[
          // {
          //   name: 'logo',
          //   display: (
          //     <>
          //       {'Logo'}
          //       <ActionButton
          //         className={classes.actionButton}
          //         Icon={UploadIcon}
          //         InverseIcon={UploadIconInverse}
          //         color={'primary'}
          //         onClick={() => {
          //           // TODO: make the replace logo feature
          //         }}>
          //         Replace logo
          //       </ActionButton>
          //     </>
          //   ),
          //   value: receiptPrintingConfig.logo
          // },
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
            name: 'companyRegistration',
            display: 'Company registration',
            value: receiptPrintingConfig.companyRegistration
          },
          {
            name: 'machineLocation',
            display: 'Machine location',
            value: receiptPrintingConfig.machineLocation
          },
          {
            name: 'customerNameOrPhoneNumber',
            display: 'Customer name or phone number (if known)',
            value: receiptPrintingConfig.logo
          },
          // {
          //   name: 'commission',
          //   display: 'Commission',
          //   value: receiptPrintingConfig.commission
          // },
          {
            name: 'exchangeRate',
            display: 'Exchange rate',
            value: receiptPrintingConfig.exchangeRate
          },
          {
            name: 'addressQRCode',
            display: 'Address QR code',
            value: receiptPrintingConfig.addressQRCode
          },
          {
            name: 'customText',
            display: 'Custom text',
            value: receiptPrintingConfig.customText
          }
        ]}
        save={save}
      />
      {/* TODO: textInput should appear only when table is in edit mode, and have it's value saved along with the table values */}
      {/* <TextInput
        className={classes.textInput}
        label={'Custom text content'}
        multiline
        rows="4"
        defaultValue={receiptPrintingConfig.customTextContent}
      /> */}
      {/* TODO: add receipt preview on the right side of the page */}
    </>
  )
})

export default ReceiptPrinting
