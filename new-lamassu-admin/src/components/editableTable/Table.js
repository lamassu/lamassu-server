import { makeStyles } from '@material-ui/core'
import { Form, Formik } from 'formik'
import * as R from 'ramda'
import React, { useState, useEffect } from 'react'
import { v4 } from 'uuid'

import PromptWhenDirty from 'src/components/PromptWhenDirty'
import Link from 'src/components/buttons/Link.js'
import { AddButton } from 'src/components/buttons/index.js'
import { TBody, Table } from 'src/components/fake-table/Table'
import { Info2, TL1 } from 'src/components/typography'

import TableCtx from './Context'
import Header from './Header'
import ERow from './Row'
import styles from './Table.styles'

const ACTION_COL_SIZE = 87
const DEFAULT_COL_SIZE = 100

const useStyles = makeStyles(styles)

const getWidth = R.compose(
  R.reduce(R.add)(0),
  R.map(it => it.width ?? DEFAULT_COL_SIZE)
)

const ETable = ({
  name,
  title,
  titleLg,
  elements = [],
  data = [],
  save,
  error: externalError,
  rowSize = 'md',
  validationSchema,
  enableCreate,
  enableEdit,
  editWidth: outerEditWidth,
  enableDelete,
  deleteWidth = ACTION_COL_SIZE,
  enableToggle,
  toggleWidth = ACTION_COL_SIZE,
  onToggle,
  forceDisable,
  disableAdd,
  initialValues,
  setEditing,
  shouldOverrideEdit,
  editOverride,
  stripeWhen,
  disableRowEdit,
  groupBy,
  sortBy,
  createText = 'Add override',
  forceAdd = false,
  tbodyWrapperClass
}) => {
  const [editingId, setEditingId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => setError(externalError), [externalError])
  useEffect(() => {
    setError(null)
    setAdding(forceAdd)
  }, [forceAdd])

  const innerSave = async value => {
    if (saving) return

    setSaving(true)

    const it = validationSchema.cast(value)
    const index = R.findIndex(R.propEq('id', it.id))(data)
    const list = index !== -1 ? R.update(index, it, data) : R.prepend(it, data)

    if (!R.equals(data[index], it)) {
      try {
        await save({ [name]: list }, it)
      } catch (err) {
        setSaving(false)
        return
      }
    }

    setAdding(false)
    setEditingId(null)
    setEditing && setEditing(false)
    setSaving(false)
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
    if (shouldOverrideEdit && shouldOverrideEdit(it)) return editOverride(it)
    setEditingId(it)
    setError(null)
    setEditing && setEditing(it, true)
  }

  const addField = () => {
    setAdding(true)
    setError(null)
    setEditing && setEditing(true, true)
  }

  const widthIfEditNull =
    enableDelete || enableToggle ? ACTION_COL_SIZE : ACTION_COL_SIZE * 2

  const editWidth = R.defaultTo(widthIfEditNull)(outerEditWidth)

  const actionColSize =
    ((enableDelete && deleteWidth) ?? 0) +
    ((enableEdit && editWidth) ?? 0) +
    ((enableToggle && toggleWidth) ?? 0)

  const width = getWidth(elements) + actionColSize
  const classes = useStyles({ width })

  const showButtonOnEmpty = !data.length && enableCreate && !adding
  const canAdd = !forceDisable && !editingId && !disableAdd && !adding
  const showTable = adding || data.length !== 0

  const innerData = sortBy ? R.sortWith(sortBy)(data) : data

  const ctxValue = {
    elements,
    enableEdit,
    onEdit,
    clearError: () => setError(null),
    error: error,
    disableRowEdit,
    editWidth,
    enableDelete,
    onDelete,
    deleteWidth,
    enableToggle,
    rowSize,
    onToggle,
    toggleWidth,
    actionColSize,
    stripeWhen,
    forceAdd,
    DEFAULT_COL_SIZE
  }

  return (
    <TableCtx.Provider value={ctxValue}>
      <div className={classes.wrapper}>
        {showButtonOnEmpty && canAdd && (
          <AddButton onClick={addField}>{createText}</AddButton>
        )}
        {showTable && (
          <>
            {(title || enableCreate) && (
              <div className={classes.outerHeader}>
                {title && titleLg && (
                  <TL1 className={classes.title}>{title}</TL1>
                )}
                {title && !titleLg && (
                  <Info2 className={classes.title}>{title}</Info2>
                )}
                {enableCreate && canAdd && (
                  <Link className={classes.addLink} onClick={addField}>
                    {createText}
                  </Link>
                )}
              </div>
            )}
            <Table>
              <Header />
              <div className={tbodyWrapperClass}>
                <TBody>
                  {adding && (
                    <Formik
                      validateOnBlur={false}
                      validateOnChange={false}
                      initialValues={{ id: v4(), ...initialValues }}
                      onReset={onReset}
                      validationSchema={validationSchema}
                      onSubmit={innerSave}>
                      <Form>
                        <PromptWhenDirty />
                        <ERow editing={true} disabled={forceDisable} />
                      </Form>
                    </Formik>
                  )}
                  {innerData.map((it, idx) => {
                    const nextElement = innerData[idx + 1]

                    const canGroup = !!groupBy && nextElement
                    const isFunction = R.type(groupBy) === 'Function'
                    const groupFunction = isFunction ? groupBy : R.prop(groupBy)

                    const isLastOfGroup =
                      canGroup &&
                      groupFunction(it) !== groupFunction(nextElement)

                    return (
                      <Formik
                        validateOnBlur={false}
                        validateOnChange={false}
                        key={it.id ?? idx}
                        enableReinitialize
                        initialValues={it}
                        onReset={onReset}
                        validationSchema={validationSchema}
                        onSubmit={innerSave}>
                        <Form>
                          <PromptWhenDirty />
                          <ERow
                            lastOfGroup={isLastOfGroup}
                            editing={editingId === it.id}
                            disabled={
                              forceDisable ||
                              (editingId && editingId !== it.id) ||
                              adding
                            }
                          />
                        </Form>
                      </Formik>
                    )
                  })}
                </TBody>
              </div>
            </Table>
          </>
        )}
      </div>
    </TableCtx.Provider>
  )
}

export default ETable
