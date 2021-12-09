import { makeStyles } from '@material-ui/core'
import { ToggleButtonGroup as MUIToggleButtonGroup } from '@material-ui/lab'
import ToggleButton from '@material-ui/lab/ToggleButton'
import React from 'react'

import { H4, P } from 'src/components/typography'
import { backgroundColor, comet } from 'src/styling/variables'
const styles = {
  noTextTransform: {
    textTransform: 'none'
  },
  flex: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'start',
    width: '90%',
    overflow: 'hidden',
    maxHeight: 80
  },
  buttonTextContent: {
    marginLeft: 32,
    textTransform: 'none',
    textAlign: 'left'
  },
  button: {
    backgroundColor: backgroundColor,
    marginBottom: 16
  },
  paragraph: {
    color: comet,
    marginTop: -10
  }
}

const useStyles = makeStyles(styles)
const ToggleButtonGroup = ({
  name,
  orientation = 'vertical',
  value,
  exclusive = true,
  onChange,
  size = 'small',
  ...props
}) => {
  const classes = useStyles()
  return (
    <MUIToggleButtonGroup
      size={size}
      name={name}
      orientation={orientation}
      value={value}
      exclusive={exclusive}
      onChange={onChange}>
      {props.options.map(option => {
        return (
          <ToggleButton
            className={classes.button}
            value={option.value}
            aria-label={option.value}
            key={option.value}>
            <div className={classes.flex}>
              <option.icon />
              <div className={classes.buttonTextContent}>
                <H4>{option.title}</H4>
                <P className={classes.paragraph}> {option.description}</P>
              </div>
            </div>
          </ToggleButton>
        )
      })}
    </MUIToggleButtonGroup>
  )
}

export default ToggleButtonGroup
