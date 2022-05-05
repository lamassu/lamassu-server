import { useQuery } from '@apollo/react-hooks'
import { makeStyles } from '@material-ui/core'
import { Formik, Form, Field } from 'formik'
import gql from 'graphql-tag'
import React, { useState } from 'react'
import * as Yup from 'yup'

import PromptWhenDirty from 'src/components/PromptWhenDirty'
import { Button } from 'src/components/buttons'
import { RadioGroup } from 'src/components/inputs/formik'
import { H4 } from 'src/components/typography'

import styles from './Shared.styles'

const useStyles = makeStyles(styles)

const GET_CONFIG = gql`
  {
    cryptoCurrencies {
      code
      display
    }
  }
`

const schema = Yup.object().shape({
  coin: Yup.string().required()
})

const ChooseCoin = ({ addData }) => {
  const classes = useStyles()
  const [error, setError] = useState(false)

  const { data } = useQuery(GET_CONFIG)
  const cryptoCurrencies = data?.cryptoCurrencies ?? []

  const onSubmit = it => {
    if (!schema.isValidSync(it)) return setError(true)

    if (it.coin !== 'BTC') {
      return addData({ coin: it.coin, zeroConf: 'none', zeroConfLimit: 0 })
    }

    addData(it)
  }

  return (
    <>
      <H4 className={error && classes.error}>
        Choose your first cryptocurrency
      </H4>

      <Formik
        validateOnBlur={false}
        validateOnChange={false}
        enableReinitialize
        initialValues={{ coin: '' }}
        onSubmit={onSubmit}>
        <Form onChange={() => setError(false)}>
          <PromptWhenDirty />
          <Field
            component={RadioGroup}
            name="coin"
            labelClassName={classes.radioLabel}
            className={classes.radioGroup}
            options={cryptoCurrencies}
          />
          {
            <Button size="lg" type="submit" className={classes.button}>
              Continue
            </Button>
          }
        </Form>
      </Formik>
    </>
  )
}

export default ChooseCoin
