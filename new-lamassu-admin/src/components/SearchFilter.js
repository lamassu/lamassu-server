import { makeStyles } from '@material-ui/core'
import React from 'react'

import Chip from 'src/components/Chip'
import { ActionButton } from 'src/components/buttons'
import { P, Label3 } from 'src/components/typography'
import { ReactComponent as CloseIcon } from 'src/styling/icons/action/close/zodiac.svg'
import { ReactComponent as FilterIcon } from 'src/styling/icons/button/filter/white.svg'
import { ReactComponent as ReverseFilterIcon } from 'src/styling/icons/button/filter/zodiac.svg'
import { onlyFirstToUpper, singularOrPlural } from 'src/utils/string'

import { chipStyles, styles } from './SearchFilter.styles'

const useChipStyles = makeStyles(chipStyles)
const useStyles = makeStyles(styles)

const SearchFilter = ({
  filters,
  onFilterDelete,
  deleteAllFilters,
  entries = 0
}) => {
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
              label={`${onlyFirstToUpper(f.type)}: ${f.value}`}
              onDelete={() => onFilterDelete(f)}
              deleteIcon={<CloseIcon className={classes.button} />}
            />
          ))}
        </div>
        <div className={classes.deleteWrapper}>
          {
            <Label3 className={classes.entries}>{`${entries} ${singularOrPlural(
              entries,
              `entry`,
              `entries`
            )}`}</Label3>
          }
          <ActionButton
            color="secondary"
            Icon={ReverseFilterIcon}
            InverseIcon={FilterIcon}
            className={classes.deleteButton}
            onClick={deleteAllFilters}>
            Delete filters
          </ActionButton>
        </div>
      </div>
    </>
  )
}

export default SearchFilter
