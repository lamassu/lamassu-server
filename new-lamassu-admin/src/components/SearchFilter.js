import { makeStyles } from '@material-ui/core'
import * as R from 'ramda'
import React from 'react'

import Chip from 'src/components/Chip'
import { ActionButton } from 'src/components/buttons'
import { P, Label2 } from 'src/components/typography'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'
import { ReactComponent as FilterIcon } from 'src/styling/icons/button/filter/white.svg'
import { ReactComponent as ReverseFilterIcon } from 'src/styling/icons/button/filter/zodiac.svg'

import { chipStyles, styles } from './SearchFilter.styles'

const useChipStyles = makeStyles(chipStyles)
const useStyles = makeStyles(styles)

const capitalize = R.converge(R.concat(), [
  R.compose(R.toUpper, R.head),
  R.tail
])

const SearchFilter = ({ filters, onFilterDelete, setFilters, entries }) => {
  const chipClasses = useChipStyles()
  const classes = useStyles()

  return (
    <>
      <P className={classes.text}>{'Filters:'}</P>
      <div className={classes.filters}>
        <div className={classes.chips}>
          {filters.map((f, idx) => (
            <Chip
              key={idx}
              classes={chipClasses}
              label={`${capitalize(f.type)}: ${f.value}`}
              onDelete={() => onFilterDelete(f)}
              deleteIcon={<CloseIcon className={classes.button} />}
            />
          ))}
        </div>
        <div className={classes.deleteWrapper}>
          {entries && (
            <Label2 className={classes.entries}>{`${entries} entries`}</Label2>
          )}
          <ActionButton
            color="secondary"
            Icon={ReverseFilterIcon}
            InverseIcon={FilterIcon}
            className={classes.deleteButton}
            onClick={() => setFilters([])}>
            Delete filters
          </ActionButton>
        </div>
      </div>
    </>
  )
}

export default SearchFilter
