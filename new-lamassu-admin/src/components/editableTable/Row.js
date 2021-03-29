import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import { Field, useFormikContext } from 'formik'
import * as R from 'ramda'
import React, { useContext, useState } from 'react'

import { DeleteDialog } from 'src/components/DeleteDialog'
import { Link, IconButton } from 'src/components/buttons'
import { Td, Tr } from 'src/components/fake-table/Table'
import { Switch } from 'src/components/inputs'
import { Label2 } from 'src/components/typography'
import { ReactComponent as DisabledDeleteIcon } from 'src/styling/icons/action/delete/disabled.svg'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import { ReactComponent as DisabledEditIcon } from 'src/styling/icons/action/edit/disabled.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as StripesSvg } from 'src/styling/icons/stripes.svg'

import TableCtx from './Context'
import styles from './Row.styles'

const useStyles = makeStyles(styles)

const ActionCol = ({ disabled, editing }) => {
  const classes = useStyles()
  const { values, submitForm, resetForm } = useFormikContext()
  const {
    editWidth,
    onEdit,
    enableEdit,
    enableDelete,
    disableRowEdit,
    onDelete,
    deleteWidth,
    enableToggle,
    onToggle,
    toggleWidth,
    forceAdd,
    clearError,
    actionColSize,
    error
  } = useContext(TableCtx)

  const disableEdit = disabled || (disableRowEdit && disableRowEdit(values))
  const cancel = () => {
    clearError()
    resetForm()
  }

  const [deleteDialog, setDeleteDialog] = useState(false)

  const onConfirmed = () => {
    onDelete(values.id).then(res => {
      if (!R.isNil(res)) setDeleteDialog(false)
    })
  }

  return (
    <>
      {editing && (
        <Td textAlign="center" width={actionColSize}>
          <Link
            className={classes.saveButton}
            type="submit"
            color="primary"
            onClick={submitForm}>
            Save
          </Link>
          {!forceAdd && (
            <Link color="secondary" onClick={cancel}>
              Cancel
            </Link>
          )}
        </Td>
      )}
      {!editing && enableEdit && (
        <Td textAlign="center" width={editWidth}>
          <IconButton
            disabled={disableEdit}
            className={classes.editButton}
            onClick={() => onEdit && onEdit(values.id)}>
            {disableEdit ? <DisabledEditIcon /> : <EditIcon />}
          </IconButton>
        </Td>
      )}
      {!editing && enableDelete && (
        <Td textAlign="center" width={deleteWidth}>
          <IconButton
            disabled={disabled}
            onClick={() => {
              setDeleteDialog(true)
            }}>
            {disabled ? <DisabledDeleteIcon /> : <DeleteIcon />}
          </IconButton>
          <DeleteDialog
            open={deleteDialog}
            setDeleteDialog={setDeleteDialog}
            onConfirmed={onConfirmed}
            onDismissed={() => {
              setDeleteDialog(false)
              clearError()
            }}
            errorMessage={error}
          />
        </Td>
      )}
      {!editing && enableToggle && (
        <Td textAlign="center" width={toggleWidth}>
          <Switch
            checked={!!values.active}
            value={!!values.active}
            disabled={disabled}
            onChange={() => onToggle(values.id)}
          />
        </Td>
      )}
    </>
  )
}

const ECol = ({ editing, focus, config, extraPaddingRight, extraPadding }) => {
  const {
    name,
    bypassField,
    input,
    editable = true,
    size,
    bold,
    width,
    textAlign,
    editingAlign = textAlign,
    suffix,
    SuffixComponent = Label2,
    textStyle = it => {},
    view = it => it?.toString(),
    inputProps = {}
  } = config

  const { values } = useFormikContext()

  const isEditing = editing && editable
  const isField = !bypassField

  const classes = useStyles({
    textAlign: isEditing ? editingAlign : textAlign,
    size
  })

  const innerProps = {
    fullWidth: true,
    autoFocus: focus,
    size,
    bold,
    textAlign: isEditing ? editingAlign : textAlign,
    ...inputProps
  }

  return (
    <Td
      className={{
        [classes.extraPaddingRight]: extraPaddingRight,
        [classes.extraPadding]: extraPadding,
        [classes.withSuffix]: suffix
      }}
      width={width}
      size={size}
      bold={bold}
      textAlign={textAlign}>
      {isEditing && isField && (
        <Field name={name} component={input} {...innerProps} />
      )}
      {isEditing && !isField && <config.input name={name} />}
      {!isEditing && values && (
        <div style={textStyle(values, isEditing)}>
          {view(values[name], values)}
        </div>
      )}
      {suffix && (
        <SuffixComponent
          className={classes.suffix}
          style={isEditing ? {} : textStyle(values, isEditing)}>
          {suffix}
        </SuffixComponent>
      )}
    </Td>
  )
}

const groupStriped = elements => {
  const [toStripe, noStripe] = R.partition(R.propEq('stripe', true))(elements)

  if (!toStripe.length) {
    return elements
  }

  const index = R.indexOf(toStripe[0], elements)
  const width = R.compose(R.sum, R.map(R.path(['width'])))(toStripe)

  return R.insert(
    index,
    { width, editable: false, view: () => <StripesSvg /> },
    noStripe
  )
}

const ERow = ({ editing, disabled, lastOfGroup, newRow }) => {
  const { touched, errors, values } = useFormikContext()
  const {
    elements,
    enableEdit,
    enableDelete,
    error,
    enableToggle,
    rowSize,
    stripeWhen
  } = useContext(TableCtx)

  const classes = useStyles()

  const shouldStripe = stripeWhen && stripeWhen(values)

  const innerElements = shouldStripe ? groupStriped(elements) : elements
  const [toSHeader] = R.partition(R.has('doubleHeader'))(elements)

  const extraPaddingIndex = toSHeader?.length
    ? R.indexOf(toSHeader[0], elements)
    : -1

  const extraPaddingRightIndex = toSHeader?.length
    ? R.indexOf(toSHeader[toSHeader.length - 1], elements)
    : -1

  const elementToFocusIndex = innerElements.findIndex(
    it => it.editable === undefined || it.editable
  )

  const classNames = {
    [classes.lastOfGroup]: lastOfGroup
  }

  const touchedErrors = R.pick(R.keys(touched), errors)
  const hasTouchedErrors = touchedErrors && R.keys(touchedErrors).length > 0
  const hasErrors = hasTouchedErrors || !!error

  const errorMessage =
    error || (touchedErrors && R.values(touchedErrors).join(', '))

  return (
    <Tr
      className={classnames(classNames)}
      size={rowSize}
      error={editing && hasErrors}
      newRow={newRow && !hasErrors}
      errorMessage={errorMessage}>
      {innerElements.map((it, idx) => {
        return (
          <ECol
            key={idx}
            config={it}
            editing={editing}
            focus={idx === elementToFocusIndex && editing}
            extraPaddingRight={extraPaddingRightIndex === idx}
            extraPadding={extraPaddingIndex === idx}
          />
        )
      })}
      {(enableEdit || enableDelete || enableToggle) && (
        <ActionCol disabled={disabled} editing={editing} />
      )}
    </Tr>
  )
}

export default ERow
