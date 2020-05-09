import { makeStyles } from '@material-ui/core/styles'
import React, { useState, memo } from 'react'

import { Link } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs'
import { H4, P } from 'src/components/typography'
import { ReactComponent as EditIconDisabled } from 'src/styling/icons/action/edit/disabled.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'

import { editablePropertyStyles } from './EditableProperty.styles'

const useStyles = makeStyles(editablePropertyStyles)

const EditableProperty = memo(
  ({ title, prefixText, disabled, options, code, save }) => {
    const [editing, setEditing] = useState(false)
    const [currentCode, setCurrentCode] = useState(code)

    const classes = useStyles()

    const innerSave = () => {
      save(currentCode)
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
            value={currentCode}
            onChange={event => setCurrentCode(event.target.value)}
            className={classes.radioButtons}
          />
        ) : (
          <P>
            {`${prefixText} ${options
              .find(it => it.code === currentCode)
              .display.toLowerCase()}`}
          </P>
        )}
      </>
    )
  }
)

export default EditableProperty
