import { makeStyles } from '@material-ui/core'
import React from 'react'

import { Link } from 'src/components/buttons'
import { H4 } from 'src/components/typography'
import { ReactComponent as DisabledEditIcon } from 'src/styling/icons/action/edit/disabled.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'

import styles from './EditHeader.styles'

const useStyles = makeStyles(styles)

const Header = ({ title, editing, disabled, setEditing }) => {
  const classes = useStyles()

  return (
    <div className={classes.header}>
      <H4 className={classes.title}>{title}</H4>
      {!editing && (
        <button
          onClick={() => setEditing(true)}
          className={classes.button}
          disabled={disabled}>
          {disabled ? <DisabledEditIcon /> : <EditIcon />}
        </button>
      )}
      {editing && (
        <div className={classes.editingButtons}>
          <Link color="primary" type="submit">
            Save
          </Link>
          <Link color="secondary" type="reset">
            Cancel
          </Link>
        </div>
      )}
    </div>
  )
}

export default Header
