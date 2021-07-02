import { makeStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import React from 'react'

import { P } from 'src/components/typography'
import { ReactComponent as CompleteStageIconZodiac } from 'src/styling/icons/stage/zodiac/complete.svg'
import { ReactComponent as CurrentStageIconZodiac } from 'src/styling/icons/stage/zodiac/current.svg'
import { ReactComponent as EmptyStageIconZodiac } from 'src/styling/icons/stage/zodiac/empty.svg'

import styles from './Sidebar.styles'

const useStyles = makeStyles(styles)

const Sidebar = ({
  data,
  displayName,
  isSelected,
  onClick,
  children,
  itemRender,
  loading = false
}) => {
  const classes = useStyles()

  return (
    <div className={classes.sidebar}>
      {loading && <P>Loading...</P>}
      {!loading &&
        data.map((it, idx) => (
          <div
            key={idx}
            className={classnames({
              [classes.activeLink]: isSelected(it),
              [classes.customRenderActiveLink]: itemRender && isSelected(it),
              [classes.customRenderLink]: itemRender,
              [classes.link]: true
            })}
            onClick={() => onClick(it)}>
            {itemRender ? itemRender(it, isSelected(it)) : displayName(it)}
          </div>
        ))}
      {!loading && children}
    </div>
  )
}

export default Sidebar

const Stepper = ({ step, it, idx, steps }) => {
  const classes = useStyles()
  const active = step === idx
  const past = idx < step
  const future = idx > step

  return (
    <div className={classes.item}>
      <span
        className={classnames({
          [classes.itemText]: true,
          [classes.itemTextActive]: active,
          [classes.itemTextPast]: past
        })}>
        {it.label}
      </span>
      {active && <CurrentStageIconZodiac />}
      {past && <CompleteStageIconZodiac />}
      {future && <EmptyStageIconZodiac />}
      {idx < steps.length - 1 && (
        <div
          className={classnames({
            [classes.stepperPath]: true,
            [classes.stepperPast]: past
          })}></div>
      )}
    </div>
  )
}

export { Stepper }
