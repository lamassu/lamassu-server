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

  const getScreen2Data = () => {
    const label1Display =
      customRequest.input.constraintType === 'spaceSeparation'
        ? 'First word label'
        : 'Text entry label'
    switch (customRequest.input.type) {
      case 'text':
        return (
          <>
            <div className={classes.halfWidth}>
              <Info2>{label1Display}</Info2>
              <Label1>{customRequest.input.label1}</Label1>
            </div>
            {customRequest.input.constraintType === 'spaceSeparation' && (
              <div className={classes.halfWidth}>
                <Info2>Second word label</Info2>
                <Label1>{customRequest.input.label2}</Label1>
              </div>
            )}
          </>
        )
      default:
        return (
          <>
            <div className={classes.halfWidth}>
              <Info2>Screen 2 input title</Info2>
              <Label1>{customRequest.screen2.title}</Label1>
            </div>
            <div className={classes.halfWidth}>
              <Info2>Screen 2 input description</Info2>
              <Label1>{customRequest.screen2.text}</Label1>
            </div>
          </>
        )
    }
  }

  const getInputData = () => {
    return (
      <>
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
      </>
    )
  }

  return (
    <div>
      <div className={classnames(classes.flex, classes.row, classes.marginTop)}>
        <div className={classes.halfWidth}>
          <Info2>Screen 1 title</Info2>
          <Label1>{customRequest.screen1.title}</Label1>
        </div>
        <div className={classnames(classes.halfWidth, classes.flex)}>
          {getScreen2Data()}
        </div>
      </div>
      <div
        className={classnames(classes.flex, classes.row, classes.marginBottom)}>
        <div className={classes.halfWidth}>
          <Info2>Screen 1 text</Info2>
          <Label1>{customRequest.screen1.text}</Label1>
        </div>
        <div className={classes.halfWidth}>{getInputData()}</div>
      </div>
    </div>
  )
}

export default DetailsCard
