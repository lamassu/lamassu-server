import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Grid } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import { SecretInput } from 'src/components/inputs/formik'
import CheckboxInput from 'src/components/inputs/formik/Checkbox'
import TitleSection from 'src/components/layout/TitleSection'
import SingleRowTable from 'src/components/single-row-table/SingleRowTable'
import { formatLong } from 'src/utils/string'

import FormRenderer from './FormRenderer'
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
    onCompleted: () => setEditingSchema(null),
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
    return R.map(elem => {
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
    }, elements)
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

  const loading = marketsLoading || configLoading

  return (
    !loading && (
      <div className={classes.wrapper}>
        <TitleSection title="3rd Party Services" />
        <Grid container spacing={4}>
          {R.values(schemas).map(schema => (
            <Grid item key={schema.code}>
              <SingleRowTable
                editMessage={'Configure ' + schema.title}
                title={schema.title}
                onEdit={() => setEditingSchema(schema)}
                items={getItems(schema.code, schema.elements)}
              />
            </Grid>
          ))}
        </Grid>
        {editingSchema && (
          <Modal
            title={`Edit ${editingSchema.name}`}
            width={525}
            handleClose={() => setEditingSchema(null)}
            open={true}>
            <FormRenderer
              save={it =>
                saveAccount({
                  variables: { accounts: { [editingSchema.code]: it } }
                })
              }
              elements={getElements(editingSchema)}
              validationSchema={getValidationSchema(editingSchema)}
              value={getAccounts(editingSchema)}
              accountId={editingSchema.code}
              reset={resetAccount}
            />
          </Modal>
        )}
      </div>
    )
  )
}

export default Services
