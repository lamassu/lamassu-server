import { makeStyles } from '@material-ui/core'
import React from 'react'

import Tooltip from 'src/components/Tooltip'
import { Link, IconButton } from 'src/components/buttons'
import { H4, P } from 'src/components/typography'
import { ReactComponent as DisabledEditIcon } from 'src/styling/icons/action/edit/disabled.svg'
import { ReactComponent as EditIcon } from 'src/styling/icons/action/edit/enabled.svg'

import styles from './EditHeader.styles'

const useStyles = makeStyles(styles)

const Header = ({ title, editing, disabled, setEditing }) => {
  const classes = useStyles()

  return (
    <div className={classes.header}>
      <H4 className={classes.title}>{title}</H4>

      {!editing && !disabled && (
        <Tooltip
          enableOver
          element={
            <IconButton
              className={classes.button}
              onClick={() => setEditing(true)}>
              <EditIcon />
            </IconButton>
          }>
          <P>Modify value</P>
        </Tooltip>
      )}

      {!editing && disabled && (
        <IconButton disabled className={classes.button}>
          <DisabledEditIcon />
        </IconButton>
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
