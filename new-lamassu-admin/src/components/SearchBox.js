import InputBase from '@material-ui/core/InputBase'
import Paper from '@material-ui/core/Paper'
import { makeStyles } from '@material-ui/core/styles'
import MAutocomplete from '@material-ui/lab/Autocomplete'
import classnames from 'classnames'
import React, { memo, useState } from 'react'

import { P } from 'src/components/typography'
import { ReactComponent as SearchIcon } from 'src/styling/icons/circle buttons/search/zodiac.svg'

import styles from './SearchBox.styles'

const useStyles = makeStyles(styles)

const SearchBox = memo(
  ({
    options,
    getOptionLabel,
    getOptionType,
    inputPlaceholder,
    size,
    ...props
  }) => {
    const classes = useStyles({ size })

    const [popupOpen, setPopupOpen] = useState(false)

    const inputClasses = {
      [classes.input]: true,
      [classes.inputWithPopup]: popupOpen
    }

    return (
      <MAutocomplete
        classes={{ option: classes.autocomplete }}
        options={options}
        getOptionLabel={it => getOptionLabel && getOptionLabel(it)}
        renderOption={it => (
          <div className={classes.item}>
            <P className={classes.itemLabel}>
              {getOptionLabel && getOptionLabel(it)}
            </P>
            <P className={classes.itemType}>
              {getOptionType && getOptionType(it)}
            </P>
          </div>
        )}
        autoHighlight
        disableClearable
        clearOnEscape
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
        {...props}
      />
    )
  }
)

export default SearchBox
