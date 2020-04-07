import { makeStyles } from '@material-ui/core'
import { Field, useFormikContext } from 'formik'
import * as R from 'ramda'
import React, { useContext } from 'react'

import { Link, IconButton } from 'src/components/buttons'
import { Td, Tr } from 'src/components/fake-table/Table'
import { Switch } from 'src/components/inputs'
import { TL2 } from 'src/components/typography'
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
    actionColSize
  } = useContext(TableCtx)

  const disableEdit = disabled || (disableRowEdit && disableRowEdit(values))

  return (
    <>
      {editing && (
        <Td textAlign="center" width={actionColSize}>
          <Link
            className={classes.cancelButton}
            color="secondary"
            onClick={resetForm}>
            Cancel
          </Link>
          <Link color="primary" onClick={submitForm}>
            Save
          </Link>
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
          <IconButton disabled={disabled} onClick={() => onDelete(values.id)}>
            {disabled ? <DisabledDeleteIcon /> : <DeleteIcon />}
          </IconButton>
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

const ECol = ({ editing, config }) => {
  const {
    name,
    input,
    editable = true,
    size,
    bold,
    width,
    textAlign,
    suffix,
    view = it => it?.toString(),
    inputProps = {}
  } = config

  const { values } = useFormikContext()
  const classes = useStyles({ textAlign, size })

  const iProps = {
    fullWidth: true,
    size,
    bold,
    textAlign,
    ...inputProps
  }

  // Autocomplete
  if (iProps.options && !iProps.getLabel) {
    iProps.getLabel = view
  }

  return (
    <Td
      className={{ [classes.withSuffix]: suffix }}
      width={width}
      size={size}
      bold={bold}
      textAlign={textAlign}>
      {editing && editable ? (
        <Field name={name} component={input} {...iProps} />
      ) : (
        values && <>{view(values[name])}</>
      )}
      {suffix && <TL2 className={classes.suffix}>{suffix}</TL2>}
    </Td>
  )
}

const groupStriped = elements => {
  const [toStripe, noStripe] = R.partition(R.has('stripe'))(elements)

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

const ERow = ({ editing, disabled }) => {
  const { errors } = useFormikContext()
  const {
    elements,
    enableEdit,
    enableDelete,
    enableToggle,
    stripeWhen
  } = useContext(TableCtx)

  const { values } = useFormikContext()
  const shouldStripe = stripeWhen && stripeWhen(values) && !editing

  const iElements = shouldStripe ? groupStriped(elements) : elements
  return (
    <Tr
      error={errors && errors.length}
      errorMessage={errors && errors.toString()}>
      {iElements.map((it, idx) => {
        return <ECol key={idx} config={it} editing={editing} />
      })}
      {(enableEdit || enableDelete || enableToggle) && (
        <ActionCol disabled={disabled} editing={editing} />
      )}
    </Tr>
  )
}

export default ERow
