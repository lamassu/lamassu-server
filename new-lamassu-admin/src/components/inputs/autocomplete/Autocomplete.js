import Paper from '@material-ui/core/Paper'
import Popper from '@material-ui/core/Popper'
import { withStyles } from '@material-ui/core/styles'
import Downshift from 'downshift'
import * as R from 'ramda'
import React, { memo, useState } from 'react'

import {
  renderInput,
  renderSuggestion,
  filterSuggestions,
  styles
} from './commons'

const Autocomplete = memo(
  ({
    suggestions,
    classes,
    placeholder,
    label,
    itemToString,
    code = 'code',
    display = 'display',
    ...props
  }) => {
    const { name, value, onBlur } = props.field
    const { touched, errors, setFieldValue } = props.form

    const [popperNode, setPopperNode] = useState(null)

    return (
      <Downshift
        id={name}
        itemToString={it => {
          if (itemToString) return itemToString(it)
          if (it) return it[display]
          return undefined
        }}
        onChange={it => setFieldValue(name, it)}
        defaultHighlightedIndex={0}
        selectedItem={value}>
        {({
          getInputProps,
          getItemProps,
          getMenuProps,
          isOpen,
          inputValue: inputValue2,
          selectedItem: selectedItem2,
          highlightedIndex,
          inputValue,
          toggleMenu,
          clearSelection
        }) => (
          <div className={classes.container}>
            {renderInput({
              name,
              fullWidth: true,
              error:
                (touched[`${name}-input`] || touched[name]) && errors[name],
              success:
                (touched[`${name}-input`] || touched[name] || value) &&
                !errors[name],
              InputProps: getInputProps({
                value: inputValue2 || '',
                placeholder,
                onBlur,
                onClick: event => {
                  setPopperNode(event.currentTarget.parentElement)
                  toggleMenu()
                },
                onChange: it => {
                  if (it.target.value === '') {
                    clearSelection()
                  }
                  inputValue = it.target.value
                }
              }),
              label
            })}
            <Popper
              open={isOpen}
              anchorEl={popperNode}
              modifiers={{ flip: { enabled: true } }}>
              <div
                {...(isOpen
                  ? getMenuProps({}, { suppressRefError: true })
                  : {})}>
                <Paper
                  square
                  style={{
                    minWidth: popperNode ? popperNode.clientWidth + 2 : null
                  }}>
                  {filterSuggestions(
                    suggestions,
                    inputValue2,
                    value ? R.of(value) : [],
                    code,
                    display
                  ).map((suggestion, index) =>
                    renderSuggestion({
                      suggestion,
                      index,
                      itemProps: getItemProps({ item: suggestion }),
                      highlightedIndex,
                      selectedItem: selectedItem2,
                      code,
                      display
                    })
                  )}
                </Paper>
              </div>
            </Popper>
          </div>
        )}
      </Downshift>
    )
  }
)

export default withStyles(styles)(Autocomplete)
