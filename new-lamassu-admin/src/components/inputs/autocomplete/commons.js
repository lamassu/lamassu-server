import MenuItem from '@material-ui/core/MenuItem'
import Fuse from 'fuse.js'
import React from 'react'
import slugify from 'slugify'
import { withStyles } from '@material-ui/core/styles'

import {
  fontColor,
  inputFontSize,
  inputFontWeight,
  zircon
} from 'src/styling/variables'
import S from 'src/utils/sanctuary'

import { TextInput } from '../base'

function renderInput({ InputProps, error, name, success, ...props }) {
  const { onChange, onBlur, value } = InputProps

  return (
    <TextInput
      name={name}
      onChange={onChange}
      onBlur={onBlur}
      value={value}
      error={!!error}
      InputProps={InputProps}
      {...props}
    />
  )
}

function renderSuggestion({
  suggestion,
  index,
  itemProps,
  highlightedIndex,
  selectedItem,
  code,
  display
}) {
  const isHighlighted = highlightedIndex === index

  const StyledMenuItem = withStyles(theme => ({
    root: {
      fontSize: 14,
      fontWeight: 400,
      color: fontColor
    },
    selected: {
      '&.Mui-selected, &.Mui-selected:hover': {
        fontWeight: 500,
        backgroundColor: zircon
      }
    }
  }))(MenuItem)

  return (
    <StyledMenuItem
      {...itemProps}
      key={suggestion[code]}
      selected={isHighlighted}
      component="div">
      {suggestion[display]}
    </StyledMenuItem>
  )
}

function filterSuggestions(
  suggestions = [],
  value = '',
  currentValues = [],
  code,
  display
) {
  const options = {
    shouldSort: true,
    threshold: 0.2,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [code, display]
  }

  const fuse = new Fuse(suggestions, options)
  const result = value ? fuse.search(slugify(value, ' ')) : suggestions

  const currentCodes = S.map(S.prop(code))(currentValues)
  const filtered = S.filter(it => !S.elem(it[code])(currentCodes))(result)

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
