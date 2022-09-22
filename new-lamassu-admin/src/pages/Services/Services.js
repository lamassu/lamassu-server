import { useQuery, useMutation } from '@apollo/react-hooks'
import { Box, makeStyles, Grid } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import { LinkDropdown } from 'src/components/buttons'
import { SecretInput } from 'src/components/inputs/formik'
import CheckboxInput from 'src/components/inputs/formik/Checkbox'
import HorizontalSeparator from 'src/components/layout/HorizontalSeparator'
import TitleSection from 'src/components/layout/TitleSection'
import { formatLong } from 'src/utils/string'

import FormRenderer from './FormRenderer'
import { DisabledService, EnabledService } from './ServiceCard'
import _schemas from './schemas'

const GET_INFO = gql`
  query getData {
    accounts
    config
  }
`

const GET_MARKETS = gql`
  query getMarkets {
    getMarkets
  }
`

const SAVE_ACCOUNT = gql`
  mutation Save($accounts: JSONObject) {
    saveAccounts(accounts: $accounts)
  }
`

const RESET_ACCOUNT = gql`
  mutation resetAccount($accountId: String) {
    resetAccount(accountId: $accountId)
  }
`

const styles = {
  wrapper: {
    // widths + spacing is a little over 1200 on the design
    // this adjusts the margin after a small reduction on card size
    marginLeft: 1
  }
}

const useStyles = makeStyles(styles)

const Services = () => {
  const [editingSchema, setEditingSchema] = useState(null)

  const { data, loading: configLoading } = useQuery(GET_INFO)
  const { data: marketsData, loading: marketsLoading } = useQuery(GET_MARKETS)
  const [saveAccount] = useMutation(SAVE_ACCOUNT, {
    onCompleted: () => setEditingSchema(null),
    refetchQueries: ['getData']
  })

  const markets = marketsData?.getMarkets

  const schemas = _schemas(markets)
  const [resetAccount] = useMutation(RESET_ACCOUNT, {
    refetchQueries: ['getData']
  })

  const classes = useStyles()

  const accounts = data?.accounts ?? {}

  const getItems = (code, elements) => {
    const faceElements = R.filter(R.prop('face'))(elements)
    const values = accounts[code] || {}
    return R.map(({ display, code, long }) => ({
      label: display,
      value: long ? formatLong(values[code]) : values[code]
    }))(faceElements)
  }

  const updateSettings = element => {
    const settings = element.settings
    const field = R.lensPath(['config', settings.field])
    const isEnabled = R.isNil(settings.requirement)
      ? true
      : R.equals(R.view(field, data), settings.requirement)
    settings.enabled = isEnabled
    return element
  }

  const getElements = ({ code, elements }) => {
    return R.map(
      elem => {
        if (elem.component === CheckboxInput) return updateSettings(elem)
        if (elem.component !== SecretInput) return elem
        return {
          ...elem,
          inputProps: {
            isPasswordFilled:
              !R.isNil(accounts[code]) &&
              !R.isNil(R.path([elem.code], accounts[code]))
          }
        }
      },
      R.filter(it => it.code !== 'enabled', elements)
    )
  }

  const getAccounts = ({ elements, code }) => {
    const account = accounts[code]
    const filterBySecretComponent = R.filter(R.propEq('component', SecretInput))
    const mapToCode = R.map(R.prop(['code']))
    const passwordFields = R.compose(
      mapToCode,
      filterBySecretComponent
    )(elements)
    return R.mapObjIndexed(
      (value, key) => (R.includes(key, passwordFields) ? '' : value),
      account
    )
  }

  const getValidationSchema = ({ code, getValidationSchema }) =>
    getValidationSchema(accounts[code])

  const isServiceEnabled = service =>
    !R.isNil(accounts[service.code]) && Boolean(accounts[service.code]?.enabled)

  const isServiceDisabled = service =>
    !R.isNil(accounts[service.code]) && !accounts[service.code]?.enabled

  const enabledServices = R.filter(isServiceEnabled, R.values(schemas))
  const disabledServices = R.filter(isServiceDisabled, R.values(schemas))
  const usedServices = R.filter(
    it => isServiceDisabled(it) || isServiceEnabled(it),
    R.values(schemas)
  )
  const unusedServices = R.filter(
    it => !isServiceDisabled(it) && !isServiceEnabled(it),
    R.values(schemas)
  )

  const enableService = service =>
    saveAccount({
      variables: {
        accounts: { [service.code]: { ...service, enabled: true } }
      }
    })

  const disableService = service =>
    saveAccount({
      variables: {
        accounts: { [service.code]: { ...service, enabled: false } }
      }
    })

  const loading = marketsLoading || configLoading
  return (
    !loading && (
      <div className={classes.wrapper}>
        <TitleSection
          title="3rd Party Services"
          appendixRight={
            <Box display="flex">
              <LinkDropdown
                color="primary"
                options={unusedServices}
                onItemClick={setEditingSchema}>
                Add new service
              </LinkDropdown>
            </Box>
          }
        />
        {!R.isEmpty(usedServices) && (
          <>
            <Grid container spacing={4}>
              {R.map(schema => {
                return (
                  <EnabledService
                    account={accounts[schema.code]}
                    service={schema}
                    setEditingSchema={setEditingSchema}
                    getItems={getItems}
                    disableService={disableService}
                  />
                )
              }, enabledServices)}
            </Grid>
            {!R.isEmpty(disabledServices) && (
              <>
                <HorizontalSeparator title="Disabled services" />
                <Grid container spacing={4}>
                  {R.map(schema => {
                    return (
                      <DisabledService
                        account={accounts[schema.code]}
                        service={schema}
                        deleteAccount={resetAccount}
                        getItems={getItems}
                        enableService={enableService}
                      />
                    )
                  }, disabledServices)}
                </Grid>
              </>
            )}
          </>
        )}
        {editingSchema && (
          <Modal
            title={`${
              R.includes(editingSchema, unusedServices) ? 'Configure' : 'Edit'
            } ${editingSchema.name}`}
            width={525}
            handleClose={() => setEditingSchema(null)}
            open={true}>
            <FormRenderer
              save={it =>
                saveAccount({
                  variables: {
                    accounts: { [editingSchema.code]: { ...it, enabled: true } }
                  }
                })
              }
              elements={getElements(editingSchema)}
              validationSchema={getValidationSchema(editingSchema)}
              value={getAccounts(editingSchema)}
            />
          </Modal>
        )}
      </div>
    )
  )
}

export default Services
