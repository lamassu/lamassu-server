import { makeStyles } from '@material-ui/core'
import { Field } from 'formik'
import React from 'react'

import RadioGroup from 'src/components/inputs/formik/RadioGroup'

const styles = {
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 28
  },
  flex: {
    display: 'flex'
  },
  tl1: {
    marginLeft: 8,
    marginTop: 25
  }
}

const useStyles = makeStyles(styles)
const options = [
  { display: 'None', code: 'none' },
  { display: 'Email', code: 'email' },
  {
    display: 'Space separation',
    subtitle: '(e.g. first and last name)',
    code: 'spaceSeparation'
  }
]

const TextEntry = () => {
  const classes = useStyles()

  return (
    <Field
      className={classes.row}
      component={RadioGroup}
      options={options}
      name="textConstraintType"
    />
  )
}

export default TextEntry
