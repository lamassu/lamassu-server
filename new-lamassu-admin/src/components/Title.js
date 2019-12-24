import { makeStyles } from '@material-ui/core/styles'
import React, { memo } from 'react'

import { spacer } from 'src/styling/variables'

import { H1 } from './typography'

const useStyles = makeStyles({
  title: {
    marginTop: spacer * 3.5,
    marginBottom: spacer * 3
  }
})

const Title = memo(({ children }) => {
  const classes = useStyles()
  return <H1 className={classes.title}>{children}</H1>
})

export default Title
