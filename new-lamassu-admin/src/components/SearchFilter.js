import { makeStyles } from '@material-ui/core'
import React from 'react'

import Chip from 'src/components/Chip'
import { P } from 'src/components/typography'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'

import { chipStyles, styles } from './SearchFilter.styles'

const useChipStyles = makeStyles(chipStyles)
const useStyles = makeStyles(styles)

const SearchFilter = ({ filters, onFilterDelete, setFilters }) => {
  const chipClasses = useChipStyles()
  const classes = useStyles()

  return (
    <>
      <P className={classes.text}>{'Filters:'}</P>
      <div>
        {filters.map((f, idx) => (
          <Chip
            key={idx}
            classes={chipClasses}
            label={`${f.type}: ${f.value}`}
            onDelete={() => onFilterDelete(f)}
            deleteIcon={<CloseIcon className={classes.button} />}
          />
        ))}
        <Chip
          classes={chipClasses}
          label={`Delete filters`}
          onDelete={() => setFilters([])}
          deleteIcon={<CloseIcon className={classes.button} />}
        />
      </div>
    </>
  )
}

export default SearchFilter
