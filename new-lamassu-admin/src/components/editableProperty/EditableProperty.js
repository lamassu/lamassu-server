import { makeStyles } from '@material-ui/core/styles'
import React, { useState, memo } from 'react'

import { H4, P } from 'src/components/typography'
import { Link } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'
import { ReactComponent as EditIconDisabled } from 'src/styling/icons/action/edit/disabled.svg'

import { editablePropertyStyles } from './EditableProperty.styles'

const useStyles = makeStyles(editablePropertyStyles)

const EditableProperty = memo(
  ({ title, prefixText, disabled, options, value, save }) => {
    const [editing, setEditing] = useState(false)
    const [currentValue, setCurrentValue] = useState(value)

    const classes = useStyles()

    const innerSave = () => {
      save(currentValue)
      setEditing(false)
    }

    const innerCancel = () => setEditing(false)

    return (
      <>
        <div className={classes.rowWrapper}>
          <H4>{title}</H4>
          {editing ? (
            <div className={classes.leftSpace}>
              <Link
                className={classes.leftSpace}
                onClick={innerCancel}
                color="secondary">
                Cancel
              </Link>
              <Link
                className={classes.leftSpace}
                onClick={innerSave}
                color="primary">
                Save
              </Link>
            </div>
          ) : (
            <div className={classes.transparentButton}>
              <button disabled={disabled} onClick={() => setEditing(true)}>
                {disabled ? <EditIconDisabled /> : <EditIcon />}
              </button>
            </div>
          )}
        </div>
        {editing ? (
          <RadioGroup
            options={options}
            value={currentValue}
            onChange={event => setCurrentValue(event.target.value)}
            className={classes.radioButtons}
          />
        ) : (
          <P>
            {`${prefixText} ${options
              .find(it => it.display === currentValue)
              .display.toLowerCase()}`}
          </P>
        )}
      </>
    )
  }
)

export default EditableProperty
