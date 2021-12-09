import { makeStyles } from '@material-ui/core'
import classnames from 'classnames'
import { Field, useFormikContext, FieldArray } from 'formik'
import * as R from 'ramda'
import React, { useEffect, useRef } from 'react'

import Button from 'src/components/buttons/ActionButton'
import RadioGroup from 'src/components/inputs/formik/RadioGroup'
import TextInput from 'src/components/inputs/formik/TextInput'
import { H4 } from 'src/components/typography'
import { ReactComponent as AddIconInverse } from 'src/styling/icons/button/add/white.svg'
import { ReactComponent as AddIcon } from 'src/styling/icons/button/add/zodiac.svg'

import styles from './formStyles.styles'
const useStyles = makeStyles(styles)

const nonEmptyStr = obj => obj.text && obj.text.length

const options = [
  { display: 'Select just one', code: 'selectOne' },
  { display: 'Select multiple', code: 'selectMultiple' }
]

const ChoiceList = () => {
  const classes = useStyles()
  const context = useFormikContext()
  const choiceListRef = useRef(null)
  const listChoices = R.path(['values', 'listChoices'])(context) ?? []
  const choiceListError = R.path(['errors', 'listChoices'])(context) ?? false

  const showErrorColor = {
    [classes.radioSubtitle]: true,
    [classes.error]:
      !R.path(['values', 'constraintType'])(context) &&
      R.path(['errors', 'constraintType'])(context)
  }

  const hasError = choice => {
    return (
      choiceListError &&
      R.filter(nonEmptyStr)(listChoices).length < 2 &&
      choice.text.length === 0
    )
  }

  useEffect(() => {
    scrollToBottom()
  }, [listChoices.length])

  const scrollToBottom = () => {
    choiceListRef.current?.scrollIntoView()
  }

  return (
    <>
      <H4 className={classnames(showErrorColor)}>Choice list constraints</H4>
      <Field
        component={RadioGroup}
        options={options}
        className={classes.row}
        name="constraintType"
      />
      <FieldArray name="listChoices">
        {({ push }) => {
          return (
            <div className={classnames(classes.flex, classes.column)}>
              <H4 className={classes.subtitle}>Choices</H4>
              <div className={classes.choiceList}>
                {listChoices.map((choice, idx) => {
                  return (
                    <div ref={choiceListRef} key={idx}>
                      <Field
                        className={classes.textInput}
                        error={hasError(choice)}
                        component={TextInput}
                        name={`listChoices[${idx}].text`}
                        label={`Choice ${idx + 1}`}
                      />
                    </div>
                  )
                })}
              </div>
              <Button
                Icon={AddIcon}
                color="primary"
                InverseIcon={AddIconInverse}
                className={classes.button}
                onClick={e => {
                  e.preventDefault()
                  return push({ text: '' })
                }}>
                Add choice
              </Button>
            </div>
          )
        }}
      </FieldArray>
    </>
  )
}

export default ChoiceList
