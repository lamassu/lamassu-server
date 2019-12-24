import Chip from '@material-ui/core/Chip'
import { withStyles } from '@material-ui/core/styles'
import React, { memo } from 'react'

import {
  fontColor,
  inputFontWeight,
  subheaderColor,
  smallestFontSize,
  inputFontFamily
} from 'src/styling/variables'

const styles = theme => ({
  root: {
    backgroundColor: subheaderColor,
    borderRadius: 4,
    margin: theme.spacing(0.5, 0.25),
    height: 18
  },
  label: {
    fontSize: smallestFontSize,
    color: fontColor,
    fontWeight: inputFontWeight,
    fontFamily: inputFontFamily,
    paddingRight: 4,
    paddingLeft: 4
  }
})

const LsChip = memo(({ classes, ...props }) => (
  <Chip size="small" classes={classes} {...props} />
))

export default withStyles(styles)(LsChip)
