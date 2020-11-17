import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import { useSelect } from 'downshift'
import React from 'react'

import { ReactComponent as Arrowdown } from 'src/styling/icons/action/arrow/regular.svg'
import { toFirstUpper } from 'src/utils/string'

import styles from './Select.styles'

const useStyles = makeStyles(styles)

function Select({ label, items, ...props }) {
  const classes = useStyles()

  const {
    isOpen,
    selectedItem,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    getItemProps
  } = useSelect({
    items,
    selectedItem: props.selectedItem,
    onSelectedItemChange: item => {
      props.onSelectedItemChange(item.selectedItem)
    }
  })

  const selectClassNames = {
    [classes.select]: true,
    [classes.selectFiltered]: selectedItem !== props.default,
    [classes.open]: isOpen
  }

  return (
    <div className={classnames(selectClassNames)}>
      <label {...getLabelProps()}>{toFirstUpper(label)}</label>
      <button {...getToggleButtonProps()}>
        <span className={classes.selectedItem}>
          {toFirstUpper(selectedItem)}
        </span>
        <Arrowdown />
      </button>
      <ul {...getMenuProps()}>
        {isOpen &&
          items.map((item, index) => (
            <li key={`${item}${index}`} {...getItemProps({ item, index })}>
              <span>{toFirstUpper(item)}</span>
            </li>
          ))}
      </ul>
    </div>
  )
}

export default Select
