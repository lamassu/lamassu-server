import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import React from 'react'

import { Label1, Info2 } from 'src/components/typography'

const styles = {
  flex: {
    display: 'flex'
  },
  column: {
    flexDirection: 'column'
  },
  halfWidth: {
    width: '50%',
    marginBottom: 15,
    marginRight: 50
  },
  marginTop: {
    marginTop: 20
  },
  marginBottom: {
    marginBottom: 20
  }
}
const useStyles = makeStyles(styles)
const DetailsCard = ({ it: customRequest }) => {
  const classes = useStyles()
  return (
    <div>
      <div className={classnames(classes.flex, classes.row, classes.marginTop)}>
        <div className={classes.halfWidth}>
          <Info2>Screen 1 title</Info2>
          <Label1>{customRequest.screen1.title}</Label1>
        </div>
        <div className={classes.halfWidth}>
          <Info2>Screen 2 title</Info2>
          <Label1>{customRequest.screen2.title}</Label1>
        </div>
      </div>
      <div
        className={classnames(classes.flex, classes.row, classes.marginBottom)}>
        <div className={classes.halfWidth}>
          <Info2>Screen 1 text</Info2>
          <Label1>{customRequest.screen1.text}</Label1>
        </div>
        <div className={classes.halfWidth}>
          {customRequest.input.choiceList && (
            <>
              <Info2>Choices</Info2>
              {customRequest.input.choiceList.map((choice, idx) => {
                return <Label1 key={idx}>{choice}</Label1>
              })}
            </>
          )}
          {customRequest.input.numDigits && (
            <>
              <Info2>Number of digits</Info2>
              <Label1>{customRequest.input.numDigits}</Label1>
            </>
          )}
          {customRequest.input.label && (
            <>
              <Info2>Input label</Info2>
              <Label1>{customRequest.input.label}</Label1>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetailsCard
