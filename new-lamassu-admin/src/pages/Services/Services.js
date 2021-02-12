import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Grid } from '@material-ui/core'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
import { SecretInput } from 'src/components/inputs/formik'
import TitleSection from 'src/components/layout/TitleSection'
import SingleRowTable from 'src/components/single-row-table/SingleRowTable'
import { formatLong } from 'src/utils/string'

import FormRenderer from './FormRenderer'
import schemas from './schemas'

const GET_INFO = gql`
  query getData {
    accounts
  }
`

const SAVE_ACCOUNT = gql`
  mutation Save($accounts: JSONObject) {
    saveAccounts(accounts: $accounts)
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

  const { data } = useQuery(GET_INFO)
  const [saveAccount] = useMutation(SAVE_ACCOUNT, {
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

  const getElements = ({ code, elements }) => {
    return R.compose(
      R.map(elem => {
        return elem.component === SecretInput
          ? R.assoc(
              'inputProps',
              {
                isPasswordFilled:
                  !R.isNil(accounts[code]) &&
                  !R.isNil(R.path([elem.code], accounts[code]))
              },
              elem
            )
          : R.identity(elem)
      })
    )(elements)
  }

  const getAccounts = ({ elements, code }) => {
    const account = accounts[code]
    const passwordFields = R.compose(
      R.reject(R.isNil),
      R.map(({ component, code }) => (component === SecretInput ? code : null))
    )(elements)
    return R.compose(
      R.mapObjIndexed((value, key, obj) =>
        R.includes(key, passwordFields) ? '' : value
      )
    )(account)
  }

  const getValidationSchema = ({
    validationSchema,
    code,
    hasSecret,
    getValidationSchema
  }) => {
    if (!hasSecret) return validationSchema
    return getValidationSchema(accounts[code])
  }

  return (
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
          width={478}
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
          />
        </Modal>
      )}
    </div>
  )
}

export default Services
