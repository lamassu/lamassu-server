import React, { memo, useState } from 'react'
import { toArray } from 'lodash/fp'
import Downshift from 'downshift'
import { withStyles } from '@material-ui/core/styles'
import Popper from '@material-ui/core/Popper'
import Paper from '@material-ui/core/Paper'

import { renderInput, renderSuggestion, filterSuggestions, styles } from './commons'

const Autocomplete = memo(({ suggestions, classes, placeholder, label, itemToString, ...props }) => {
  const { name, value, onBlur } = props.field
  const { touched, errors, setFieldValue } = props.form

  const [popperNode, setPopperNode] = useState(null)

  return (
    <Downshift
      id={name}
      itemToString={it => itemToString ? itemToString(it) : it && it.display}
      onChange={it => setFieldValue(name, it)}
      defaultHighlightedIndex={0}
      selectedItem={value}
    >
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
            id: name,
            fullWidth: true,
            classes,
            error: (touched[`${name}-input`] || touched[name]) && errors[name],
            success: (touched[`${name}-input`] || touched[name] || value) && !errors[name],
            InputProps: getInputProps({
              value: inputValue2 || '',
              placeholder,
              onBlur,
              onClick: () => toggleMenu(),
              onChange: it => {
                if (it.target.value === '') {
                  clearSelection()
                }
                inputValue = it.target.value
              }
            }),
            ref: node => {
              setPopperNode(node)
            },
            label
          })}
          <Popper open={isOpen} anchorEl={popperNode}>
            <div {...(isOpen ? getMenuProps({}, { suppressRefError: true }) : {})}>
              <Paper
                square
                style={{ marginTop: 8, minWidth: popperNode ? popperNode.clientWidth : null }}
              >
                {filterSuggestions(suggestions, inputValue2, toArray(value)).map((suggestion, index) =>
                  renderSuggestion({
                    suggestion,
                    index,
                    itemProps: getItemProps({ item: suggestion }),
                    highlightedIndex,
                    selectedItem: selectedItem2
                  })
                )}
              </Paper>
            </div>
          </Popper>
        </div>
      )}
    </Downshift>
  )
})

export default withStyles(styles)(Autocomplete)
