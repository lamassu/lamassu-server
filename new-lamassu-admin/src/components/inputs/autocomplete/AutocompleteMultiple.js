import Paper from '@material-ui/core/Paper'
import Popper from '@material-ui/core/Popper'
import { withStyles } from '@material-ui/core/styles'
import Downshift from 'downshift'
import React, { useState, memo } from 'react'

import Chip from 'src/components/Chip'

import {
  renderInput,
  renderSuggestion,
  filterSuggestions,
  styles,
} from './commons'

const AutocompleteMultiple = memo(
  ({ suggestions, classes, placeholder, label, ...props }) => {
    const { name, value, onBlur } = props.field
    const { touched, errors, setFieldValue } = props.form

    const [inputValue, setInputValue] = useState('')
    const [popperNode, setPopperNode] = useState(null)

    const onDelete = item => {
      const selectedItem = (value || []).slice()
      const index = selectedItem.indexOf(item)
      if (index === -1) return

      selectedItem.splice(selectedItem.indexOf(item), 1)
      setFieldValue(name, selectedItem)
    }

    const handleKeyDown = event => {
      if (value.length && !inputValue.length && event.key === 'Backspace') {
        onDelete(value[value.length - 1])
      }
    }

    return (
      <Downshift
        id={name}
        inputValue={inputValue}
        itemToString={it => it && it.display}
        defaultHighlightedIndex={0}
        onChange={it => {
          setInputValue('')
          let selectedItem = (value || []).slice()

          if (selectedItem.indexOf(it) === -1) {
            selectedItem = [...selectedItem, it]
          }

          setFieldValue(name, selectedItem)
        }}
        selectedItem={value}>
        {({
          getInputProps,
          getItemProps,
          getMenuProps,
          isOpen,
          inputValue: inputValue2,
          selectedItem: selectedItem2,
          highlightedIndex,
          toggleMenu,
        }) => (
          <div className={classes.container}>
            {renderInput({
              id: name,
              fullWidth: true,
              classes,
              error:
                (touched[`${name}-input`] || touched[name]) && errors[name],
              success:
                (touched[`${name}-input`] || touched[name] || value) &&
                !errors[name],
              InputProps: getInputProps({
                startAdornment: (value || []).map(item => (
                  <Chip key={item.code} tabIndex={-1} label={item.code} />
                )),
                onBlur,
                onChange: it => setInputValue(it.target.value),
                onClick: () => toggleMenu(),
                onKeyDown: handleKeyDown,
                placeholder,
              }),
              ref: node => {
                setPopperNode(node)
              },
              label,
            })}
            <Popper open={isOpen} anchorEl={popperNode}>
              <div
                {...(isOpen
                  ? getMenuProps({}, { suppressRefError: true })
                  : {})}>
                <Paper
                  className={classes.paper}
                  square
                  style={{
                    marginTop: 8,
                    minWidth: popperNode ? popperNode.clientWidth : null,
                  }}>
                  {filterSuggestions(suggestions, inputValue2, value).map(
                    (suggestion, index) =>
                      renderSuggestion({
                        suggestion,
                        index,
                        itemProps: getItemProps({ item: suggestion }),
                        highlightedIndex,
                        selectedItem: selectedItem2,
                      }),
                  )}
                </Paper>
              </div>
            </Popper>
          </div>
        )}
      </Downshift>
    )
  },
)

export default withStyles(styles)(AutocompleteMultiple)
