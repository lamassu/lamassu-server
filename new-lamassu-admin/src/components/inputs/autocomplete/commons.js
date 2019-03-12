import React from 'react'
import { some, deburr, take, filter, compose } from 'lodash/fp'
import TextField from '@material-ui/core/TextField'
import MenuItem from '@material-ui/core/MenuItem'

import { fontColor, inputFontSize, inputFontWeight } from '../../../styling/variables'

function renderInput (inputProps) {
  const { InputProps, classes, ref, ...other } = inputProps

  return (
    <TextField
      InputProps={{
        inputRef: ref,
        classes: {
          root: classes.inputRoot,
          input: classes.inputInput
        },
        ...InputProps
      }}
      {...other}
    />
  )
}

function renderSuggestion ({ suggestion, index, itemProps, highlightedIndex, selectedItem }) {
  const isHighlighted = highlightedIndex === index

  const isSelected = ((selectedItem && selectedItem.display) || '').indexOf(suggestion.display) > -1

  return (
    <MenuItem
      {...itemProps}
      key={suggestion.code}
      selected={isHighlighted}
      component='div'
      style={{
        fontSize: 14,
        fontWeight: isSelected ? 500 : 400
      }}
    >
      {suggestion.display}
    </MenuItem>
  )
}

function filterSuggestions (suggestions, value, currentValues) {
  const inputValue = deburr((value || '').trim()).toLowerCase()
  const inputLength = inputValue.length

  // TODO make it fuzzy and by every property
  const filterByLabel = filter(it => {
    return it.display.slice(0, inputLength).toLowerCase() === inputValue
  })
  const filterOutCurrent = filter(it => !some(({ code }) => it.code === code)(currentValues))

  const onlyFive = compose(
    take(5),
    filterOutCurrent,
    filterByLabel
  )

  return onlyFive(suggestions)
}

const styles = theme => ({
  root: {
    flexGrow: 1,
    height: 250
  },
  container: {
    flexGrow: 1,
    position: 'relative'
  },
  paper: {
    // position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing(1),
    left: 0,
    right: 0
  },
  inputRoot: {
    fontSize: inputFontSize,
    color: fontColor,
    fontWeight: inputFontWeight,
    flexWrap: 'wrap'
  },
  inputInput: {
    flex: 1
  },
  divider: {
    height: theme.spacing(2)
  }
})

export { renderInput, renderSuggestion, filterSuggestions, styles }
