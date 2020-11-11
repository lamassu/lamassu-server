import InputBase from '@material-ui/core/InputBase'
import Paper from '@material-ui/core/Paper'
import { makeStyles } from '@material-ui/core/styles'
import MAutocomplete from '@material-ui/lab/Autocomplete'
import classnames from 'classnames'
import * as R from 'ramda'
import React, { memo, useState } from 'react'

import { P } from 'src/components/typography'
import { ReactComponent as SearchIcon } from 'src/styling/icons/circle buttons/search/zodiac.svg'

import styles from './SearchBox.styles'

const useStyles = makeStyles(styles)

const SearchBox = memo(
  ({
    elements = [],
    data = [],
    inputPlaceholder = '',
    size,
    onChange,
    ...props
  }) => {
    const classes = useStyles({ size })

    const [popupOpen, setPopupOpen] = useState(false)

    const inputClasses = {
      [classes.input]: true,
      [classes.inputWithPopup]: popupOpen
    }

    const getOptions = R.compose(
      R.uniq,
      R.map(it => ({
        value: it[0].view(it[1]),
        ...it[0]
      })),
      R.xprod
    )

    return (
      <MAutocomplete
        classes={{ option: classes.autocomplete }}
        options={getOptions(elements, data)}
        getOptionLabel={it => it.value}
        renderOption={it => (
          <div className={classes.item}>
            <P className={classes.itemLabel}>{it.value}</P>
            <P className={classes.itemType}>{it.type}</P>
          </div>
        )}
        autoHighlight
        disableClearable
        clearOnEscape
        multiple
        filterSelectedOptions
        getOptionSelected={(option, value) => option.type === value.type}
        PaperComponent={({ children }) => (
          <Paper elevation={0} className={classes.popup}>
            <div className={classes.separator} />
            {children}
          </Paper>
        )}
        renderInput={params => {
          return (
            <InputBase
              ref={params.InputProps.ref}
              {...params}
              className={classnames(inputClasses)}
              startAdornment={<SearchIcon className={classes.iconButton} />}
              placeholder={inputPlaceholder}
              inputProps={{
                className: classes.bold,
                classes: {
                  root: classes.size
                },
                ...params.inputProps
              }}
            />
          )
        }}
        onOpen={() => setPopupOpen(true)}
        onClose={() => setPopupOpen(false)}
        onChange={(_, filters) => {
          const predicates = R.map(
            f => it => R.equals(f.view(it), f.value),
            filters
          )
          onChange(filters ? R.filter(R.allPass(predicates), data) : data)
        }}
        {...props}
      />
    )
  }
)

export default SearchBox
