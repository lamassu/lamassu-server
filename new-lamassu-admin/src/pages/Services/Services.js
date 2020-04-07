import { useQuery, useMutation } from '@apollo/react-hooks'
import { makeStyles, Grid } from '@material-ui/core'
import { gql } from 'apollo-boost'
import * as R from 'ramda'
import React, { useState } from 'react'

import Modal from 'src/components/Modal'
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
  mutation Save($account: JSONObject) {
    saveAccount(account: $account)
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

const Services = ({ key: SCREEN_KEY }) => {
  const [editingSchema, setEditingSchema] = useState(null)

  const { data } = useQuery(GET_INFO)
  const [saveAccount] = useMutation(SAVE_ACCOUNT, {
    onCompleted: () => setEditingSchema(null),
    refetchQueries: ['getData']
  })

  const classes = useStyles()

  const accounts = data?.accounts ?? []

  const getValue = code => R.find(R.propEq('code', code))(accounts)

  const getItems = (code, elements) => {
    const faceElements = R.filter(R.prop('face'))(elements)
    const values = getValue(code) || {}
    return R.map(({ display, code, long }) => ({
      label: display,
      value: long ? formatLong(values[code]) : values[code]
    }))(faceElements)
  }

  return (
    <div className={classes.wrapper}>
      <TitleSection title="3rd Party Services" />
      <Grid container spacing={4}>
        {R.values(schemas).map(schema => (
          <Grid item key={schema.code}>
            <SingleRowTable
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
                variables: { account: { code: editingSchema.code, ...it } }
              })
            }
            elements={editingSchema.elements}
            validationSchema={editingSchema.validationSchema}
            value={getValue(editingSchema.code)}
          />
        </Modal>
      )}
    </div>
  )
}

export default Services
