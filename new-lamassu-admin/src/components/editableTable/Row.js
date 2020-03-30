import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import { Field, useFormikContext } from 'formik'
import React from 'react'

import { Link, IconButton } from 'src/components/buttons'
import { Td, Tr } from 'src/components/fake-table/Table'
import { TL2 } from 'src/components/typography'
import { ReactComponent as DisabledDeleteIcon } from 'src/styling/icons/action/delete/disabled.svg'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import { ReactComponent as DisabledEditIcon } from 'src/styling/icons/action/edit/disabled.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'

import styles from './Row.styles'
import { ACTION_COL_SIZE } from './consts'

const useStyles = makeStyles(styles)

const ActionCol = ({
  editing,
  setEditing,
  enableEdit,
  disabled,
  onDelete,
  enableDelete
}) => {
  const classes = useStyles()
  const { values, submitForm, resetForm } = useFormikContext()

  const actionColSize =
    enableDelete && enableEdit ? ACTION_COL_SIZE / 2 : ACTION_COL_SIZE

  return (
    <>
      {editing && (
        <Td textAlign="center" width={ACTION_COL_SIZE}>
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
        <Td textAlign="right" width={actionColSize}>
          <IconButton
            disabled={disabled}
            className={classes.editButton}
            onClick={() => setEditing && setEditing(values.id)}>
            {disabled ? <DisabledEditIcon /> : <EditIcon />}
          </IconButton>
        </Td>
      )}
      {!editing && enableDelete && (
        <Td textAlign="right" width={actionColSize}>
          <IconButton disabled={disabled} onClick={() => onDelete(values.id)}>
            {disabled ? <DisabledDeleteIcon /> : <DeleteIcon />}
          </IconButton>
        </Td>
      )}
    </>
  )
}

const ECol = ({ editing, config }) => {
  const {
    name,
    input,
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

  const viewClasses = {
    [classes.bold]: bold,
    [classes.size]: true
  }

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
      textAlign={textAlign}>
      {editing && <Field name={name} component={input} {...iProps} />}
      {!editing && values && (
        <div className={classnames(viewClasses)}>{view(values[name])}</div>
      )}
      {suffix && <TL2 className={classes.suffix}>{suffix}</TL2>}
    </Td>
  )
}

const ERow = ({
  elements,
  enableEdit,
  enableDelete,
  onDelete,
  editing,
  setEditing,
  disabled
}) => {
  const { errors } = useFormikContext()

  return (
    <Tr
      error={errors && errors.length}
      errorMessage={errors && errors.toString()}>
      {elements.map((it, idx) => (
        <ECol key={idx} config={it} editing={editing} />
      ))}
      {(enableEdit || enableDelete) && (
        <ActionCol
          disabled={disabled}
          editing={editing}
          setEditing={setEditing}
          onDelete={onDelete}
          enableEdit={enableEdit}
          enableDelete={enableDelete}
        />
      )}
    </Tr>
  )
}

export default ERow
