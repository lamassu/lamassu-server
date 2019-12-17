import React from 'react'
import Fuse from 'fuse.js'
import S from '../../../utils/sanctuary'
import slugify from 'slugify'
import TextField from '@material-ui/core/TextField'
import MenuItem from '@material-ui/core/MenuItem'

import { fontColor, inputFontSize, inputFontWeight } from '../../../styling/variables'

function renderInput (inputProps) {
  const { onBlur, success, InputProps, classes, ref, ...other } = inputProps

  return (
    <TextField
      InputProps={{
        inputRef: ref,
        classes: {
          root: classes.inputRoot,
          input: classes.inputInput,
          underline: success ? classes.success : ''
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

function filterSuggestions (suggestions = [], value = '', currentValues = []) {
  const options = {
    shouldSort: true,
    threshold: 0.2,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [
      'code',
      'display'
    ]
  }

  const fuse = new Fuse(suggestions, options)
  const result = value ? fuse.search(slugify(value, ' ')) : suggestions

  const currentCodes = S.map(S.prop('code'))(currentValues)
  const filtered = S.filter(it => !S.elem(it.code)(currentCodes))(result)

  const amountToTake = S.min(filtered.length)(5)

  return S.compose(S.fromMaybe([]))(S.take(amountToTake))(filtered)
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
  success: {
    '&:after': {
      transform: 'scaleX(1)'
    }
  },
  divider: {
    height: theme.spacing(2)
  }
})

export { renderInput, renderSuggestion, filterSuggestions, styles }
