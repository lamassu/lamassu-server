import { makeStyles } from '@material-ui/core'
import { Form, Formik } from 'formik'
import * as R from 'ramda'
import React, { useState } from 'react'
import { v4 } from 'uuid'

import Link from 'src/components/buttons/Link.js'
import { AddButton } from 'src/components/buttons/index.js'
import { TBody, Table } from 'src/components/fake-table/Table'
import { Info2 } from 'src/components/typography'

import Header from './Header'
import ERow from './Row'
import styles from './Table.styles'
import { DEFAULT_COL_SIZE, ACTION_COL_SIZE } from './consts'

const useStyles = makeStyles(styles)

const getWidth = R.compose(
  R.reduce(R.add)(0),
  R.map(it => it.width ?? DEFAULT_COL_SIZE)
)

const ETable = ({
  name,
  title,
  elements = [],
  data = [],
  save,
  validationSchema,
  enableCreate,
  forceDisable,
  disableAdd,
  enableDelete,
  initialValues,
  enableEdit,
  setEditing,
  createText = 'Add override'
}) => {
  const [editingId, setEditingId] = useState(null)
  const [adding, setAdding] = useState(false)

  const innerSave = async it => {
    const index = R.findIndex(R.propEq('id', it.id))(data)
    const list = index !== -1 ? R.update(index, it, data) : R.prepend(it, data)

    // no response means the save failed
    const response = await save({ [name]: list })
    if (!response) return
    setAdding(false)
    setEditingId(null)
  }

  const onDelete = id => {
    const list = R.reject(it => it.id === id, data)
    return save({ [name]: list })
  }

  const onReset = () => {
    setAdding(false)
    setEditingId(null)
    setEditing && setEditing(false)
  }

  const onEdit = it => {
    setEditingId(it)
    setEditing && setEditing(it, true)
  }

  const addField = () => setAdding(true)

  const actionSize = enableEdit || enableDelete ? ACTION_COL_SIZE : 0
  const width = getWidth(elements) + actionSize
  const classes = useStyles({ width })

  const showButtonOnEmpty = !data.length && enableCreate && !adding
  const canAdd = !forceDisable && !editingId && !disableAdd && !adding
  const showTable = adding || data.length !== 0

  return (
    <div className={classes.wrapper}>
      {showButtonOnEmpty && (
        <AddButton disabled={!canAdd} onClick={addField}>
          {createText}
        </AddButton>
      )}
      {showTable && (
        <>
          <div className={classes.outerHeader}>
            {title && <Info2 className={classes.title}>{title}</Info2>}
            {enableCreate && canAdd && (
              <Link className={classes.addLink} onClick={addField}>
                {createText}
              </Link>
            )}
          </div>
          <Table>
            <Header
              elements={elements}
              enableEdit={enableEdit}
              enableDelete={enableDelete}
            />
            <TBody>
              {adding && (
                <Formik
                  initialValues={{ id: v4(), ...initialValues }}
                  onReset={onReset}
                  validationSchema={validationSchema}
                  onSubmit={innerSave}>
                  <Form>
                    <ERow
                      editing={true}
                      disabled={forceDisable}
                      enableEdit={enableEdit}
                      enableDelete={enableDelete}
                      elements={elements}
                    />
                  </Form>
                </Formik>
              )}
              {data.map((it, idx) => (
                <Formik
                  key={it.id ?? idx}
                  enableReinitialize
                  initialValues={it}
                  onReset={onReset}
                  validationSchema={validationSchema}
                  onSubmit={innerSave}>
                  <Form>
                    <ERow
                      editing={editingId === it.id}
                      disabled={
                        forceDisable || (editingId && editingId !== it.id)
                      }
                      setEditing={onEdit}
                      onDelete={onDelete}
                      enableEdit={enableEdit}
                      enableDelete={enableDelete}
                      elements={elements}
                    />
                  </Form>
                </Formik>
              ))}
            </TBody>
          </Table>
        </>
      )}
    </div>
  )
}

export default ETable
