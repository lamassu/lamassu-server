import { useQuery, useMutation } from '@apollo/react-hooks'
import { Box, makeStyles, Grid } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'
import * as uuid from 'uuid'

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
    accountsConfig {
      code
      class
      cryptos
    }
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
  mutation resetAccount($accountId: String, $instanceId: ID) {
    resetAccount(accountId: $accountId, instanceId: $instanceId)
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
  const [resetAccount] = useMutation(RESET_ACCOUNT, {
    refetchQueries: ['getData']
  })

  const classes = useStyles()

  const accounts = data?.accounts ?? {}
  const cryptos =
    R.reduce(
      (acc, value) => ({ ...acc, [value.code]: value.cryptos }),
      {},
      R.filter(it => it.class === 'wallet', data?.accountsConfig ?? [])
    ) ?? {}

  const schemas = _schemas({ markets, cryptos })

  const serviceInstances = R.reduce(
    (acc, value) => {
      acc.push(
        ...R.map(
          ite => ({ code: accounts[value].code ?? value, ...ite }),
          accounts[value].instances ?? []
        )
      )
      return acc
    },
    [],
    R.keys(accounts)
  )

  const getItems = (id, code, elements) => {
    const faceElements = R.filter(R.prop('face'))(elements)
    const values = R.find(it => it.id === id, accounts[code].instances) || {}
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

  const getElements = ({ elements }, account) => {
    return R.map(
      elem => {
        if (elem.component === CheckboxInput) return updateSettings(elem)
        if (elem.component !== SecretInput) return elem
        return {
          ...elem,
          inputProps: {
            isPasswordFilled:
              !R.isNil(account) && !R.isNil(R.path([elem.code], account))
          }
        }
      },
      R.filter(it => it.code !== 'enabled', elements)
    )
  }

  const getInstanceIndex = (account = {}) =>
    R.findIndex(
      it => it.id === account?.id,
      accounts[account?.code]?.instances ?? []
    )

  const getAccounts = ({ elements }, account) => {
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

  const getValidationSchema = ({ schema, account }) => {
    return schema.getValidationSchema(account)
  }

  const isServiceEnabled = service =>
    !R.isNil(service) && Boolean(service?.enabled)

  const isServiceDisabled = service => !R.isNil(service) && !service?.enabled

  const [enabledServices, limbo] = R.partition(
    isServiceEnabled,
    serviceInstances
  )
  const [disabledServices, unusedServices] = R.partition(
    isServiceDisabled,
    limbo
  )
  const usedServices = R.concat(enabledServices, disabledServices)

  const createAccount = (schema, newAccount) => {
    const accountInstances = R.isNil(accounts[schema.code])
      ? []
      : R.clone(accounts[schema.code].instances)

    accountInstances.push(R.merge(newAccount, { id: uuid.v4(), enabled: true }))

    return saveAccount({
      variables: {
        accounts: {
          [schema.code]: {
            instances: accountInstances
          }
        }
      }
    })
  }

  const editAccount = ({ schema, account }, newAccount) => {
    const instanceIndex = getInstanceIndex(account)

    if (instanceIndex === -1) {
      return createAccount(schema, newAccount)
    }

    const accountClone = R.clone(accounts[account.code])
    accountClone.instances[instanceIndex] = R.merge(account, newAccount)

    return saveAccount({
      variables: {
        accounts: { [account.code]: accountClone }
      }
    })
  }

  const enableAccount = account => {
    const instanceIndex = getInstanceIndex(account)
    const updatedAccount = R.clone(accounts[account.code])
    updatedAccount.instances[instanceIndex].enabled = true
    return saveAccount({
      variables: {
        accounts: { [account.code]: updatedAccount }
      }
    })
  }

  const disableAccount = account => {
    const instanceIndex = getInstanceIndex(account)
    const updatedAccount = R.clone(accounts[account.code])
    updatedAccount.instances[instanceIndex].enabled = false
    return saveAccount({
      variables: {
        accounts: { [account.code]: updatedAccount }
      }
    })
  }

  const getAvailableServicesToAdd = (services, instances) => {
    return R.filter(
      it =>
        it.allowMultiInstances ||
        !R.any(ite => it.code === ite.code, instances),
      services
    )
  }

  const loading = marketsLoading || configLoading

  return (
    !loading && (
      <div className={classes.wrapper}>
        <TitleSection
          title="Third-party services"
          appendixRight={
            <Box display="flex">
              <LinkDropdown
                color="primary"
                options={getAvailableServicesToAdd(
                  R.values(schemas),
                  serviceInstances
                )}
                onItemClick={it => setEditingSchema({ schema: it })}>
                Add new service
              </LinkDropdown>
            </Box>
          }
        />
        {!R.isEmpty(usedServices) && (
          <>
            <Grid container spacing={4}>
              {R.map(service => {
                return (
                  <EnabledService
                    account={service}
                    schema={schemas[service.code]}
                    setEditingSchema={setEditingSchema}
                    getItems={getItems}
                    disableAccount={disableAccount}
                  />
                )
              }, enabledServices)}
            </Grid>
            {!R.isEmpty(disabledServices) && (
              <>
                <HorizontalSeparator title="Disabled services" />
                <Grid container spacing={4}>
                  {R.map(service => {
                    return (
                      <DisabledService
                        account={service}
                        schema={schemas[service.code]}
                        deleteAccount={resetAccount}
                        getItems={getItems}
                        enableAccount={enableAccount}
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
            } ${editingSchema.schema.name}`}
            width={525}
            handleClose={() => setEditingSchema(null)}
            open={true}>
            <FormRenderer
              save={it => editAccount(editingSchema, it)}
              elements={getElements(
                editingSchema.schema,
                editingSchema.account ?? {}
              )}
              validationSchema={getValidationSchema(editingSchema)}
              value={getAccounts(
                editingSchema.schema,
                editingSchema.account ?? {}
              )}
              supportArticle={editingSchema?.supportArticle}
              SplashScreenComponent={editingSchema.schema.SplashScreenComponent}
            />
          </Modal>
        )}
      </div>
    )
  )
}

export default Services
