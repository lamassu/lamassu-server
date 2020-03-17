import React, { memo } from 'react'
import * as R from 'ramda'
import classnames from 'classnames'
import { Form, Formik, Field, useFormikContext } from 'formik'
import { makeStyles } from '@material-ui/core'

import { Link } from 'src/components/buttons'
import { Td, Tr } from 'src/components/fake-table/Table'
import { TextInputDisplay } from 'src/components/inputs/base/TextInput'
import { ReactComponent as DeleteIcon } from 'src/styling/icons/action/delete/enabled.svg'
import { ReactComponent as DisabledDeleteIcon } from 'src/styling/icons/action/delete/disabled.svg'

const styles = {
  button: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 0,
    cursor: 'pointer'
  },
  actionCol: {
    display: 'flex'
  },
  actionColDisplayMode: {
    justifyContent: 'center'
  },
  actionColEditMode: {
    justifyContent: 'flex-end',
    '& > :first-child': {
      marginRight: 16
    }
  }
}

const useStyles = makeStyles(styles)

const ERow = memo(
  ({ elements, editing, setEditing, disableAction, action }) => {
    const classes = useStyles()

    const actionCol = R.last(elements)
    const { values, errors } = useFormikContext()

    const actionColClasses = {
      [classes.actionCol]: true,
      [classes.actionColDisplayMode]: !editing,
      [classes.actionColEditMode]: editing
    }

    const icon = (action, disabled) => {
      if (action === 'delete' && !disabled) return <DeleteIcon />
      if (action === 'delete' && disabled) return <DisabledDeleteIcon />
    }

    return (
      <Tr
        error={errors && errors.length}
        errorMessage={errors && errors.toString()}>
        {R.init(elements).map(
          (
            {
              name,
              input,
              size,
              textAlign,
              type,
              view = it => it?.toString(),
              inputProps
            },
            idx
          ) => {
            return (
              <Td key={idx} size={size} textAlign={textAlign}>
                {editing && (
                  <Field
                    id={name}
                    name={name}
                    component={input}
                    {...inputProps}
                  />
                )}
                {!editing && type === 'text' && (
                  <TextInputDisplay
                    display={view(values[name])}
                    {...inputProps}
                  />
                )}
              </Td>
            )
          }
        )}
        <Td size={actionCol.size} className={classnames(actionColClasses)}>
          {!editing && !disableAction && (
            <button
              type="button"
              className={classes.button}
              onClick={() => action(values)}>
              {icon(actionCol.name, disableAction)}
            </button>
          )}
          {!editing && disableAction && (
            <div>{icon(actionCol.name, disableAction)}</div>
          )}
          {editing && (
            <>
              <Link color="secondary" type="reset">
                Cancel
              </Link>
              <Link color="primary" type="submit">
                Save
              </Link>
            </>
          )}
        </Td>
      </Tr>
    )
  }
)

const ERowWithFormik = memo(
  ({
    value,
    validationSchema,
    save,
    reset,
    action,
    elements,
    editing,
    disableAction
  }) => {
    return (
      <Formik
        enableReinitialize
        initialValues={value}
        validationSchema={validationSchema}
        onSubmit={save}
        onReset={reset}>
        <Form>
          <ERow
            elements={elements}
            editing={editing}
            disableAction={disableAction}
            action={action}
          />
        </Form>
      </Formik>
    )
  }
)

export default ERowWithFormik
