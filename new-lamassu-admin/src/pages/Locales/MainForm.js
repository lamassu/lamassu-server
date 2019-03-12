import React, { useState, memo } from 'react'
import { Form, FastField } from 'formik'
import { __, compose, join, map, get, isEmpty } from 'lodash/fp'

import { Link } from '../../components/buttons'
import { Autocomplete, AutocompleteMultiple } from '../../components/inputs'

import { Checkbox } from '../../components/inputs/formik'

import {
  EditCell,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell as Td
} from '../../components/table'

// import styles from './MainForm.module.scss'
import { Table as EditableTable } from '../../components/editableTable'

const styles = {}

const sizes = {
  country: 200,
  fiatCurrency: 150,
  languages: 240,
  cryptoCurrencies: 280,
  showRates: 125,
  action: 175
}

const MainForm = memo(
  ({ values, resetForm, submitForm, errors, editing, setEditing, data }) => {
    const [submitted, setSubmitted] = useState(false)

    const getData = get(__, data)
    const displayCodeArray = compose(join(', '), map(get('code')))

    const save = () => {
      setSubmitted(true)
      submitForm()
    }

    const cancel = () => {
      resetForm()
      setSubmitted(false)
      setEditing(false)
    }

    const ViewFields = (
      <>
        <Td>{values.country && values.country.display}</Td>
        <Td>{values.fiatCurrency && values.fiatCurrency.code}</Td>
        <Td>
          {values.languages && values.languages.map(it => it.code).join(', ')}
        </Td>
        <Td>
          {values.cryptoCurrencies &&
            values.cryptoCurrencies.map(it => it.code).join(', ')}
        </Td>
        <Td>{values.showRates ? 'true' : 'false'}</Td>
        <Td rightAlign>
          <Link color='primary' onClick={() => setEditing(true)}>
            Edit
          </Link>
        </Td>
      </>
    )

    const EditFields = (
      <>
        <Td>
          <FastField
            name='country'
            component={Autocomplete}
            suggestions={data && data.countries}
          />
        </Td>
        <Td>
          <FastField
            name='fiatCurrency'
            component={Autocomplete}
            suggestions={data && data.currencies}
          />
        </Td>
        <Td>
          <FastField
            name='languages'
            component={AutocompleteMultiple}
            suggestions={data && data.languages}
          />
        </Td>
        <Td>
          <FastField
            name='cryptoCurrencies'
            component={AutocompleteMultiple}
            suggestions={data && data.cryptoCurrencies}
          />
        </Td>
        <Td>
          <FastField name='showRates' component={Checkbox} />
        </Td>
        <EditCell save={save} cancel={cancel} />
      </>
    )

    return (
      <Form>
        <Table>
          <colgroup>
            <col className={styles.bigColumn} />
            <col className={styles.mediumColumn} />
            <col className={styles.mediumColumn} />
            <col className={styles.bigColumn} />
            <col className={styles.showRates} />
            <col className={styles.actionColumn} />
          </colgroup>
          <TableHead>
            <TableRow header>
              <TableHeader>Country</TableHeader>
              <TableHeader>Fiat Currency</TableHeader>
              <TableHeader>Languages</TableHeader>
              <TableHeader>Crypto Currencies</TableHeader>
              <TableHeader>Show Rates</TableHeader>
              <TableHeader />
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow error={submitted && !isEmpty(errors)}>
              {editing ? EditFields : ViewFields}
            </TableRow>
          </TableBody>
        </Table>

        <EditableTable
          cancel={cancel}
          save={save}
          data={[values]}
          elements={[
            {
              name: 'country',
              size: sizes.country,
              view: get('display'),
              input: Autocomplete,
              inputProps: { suggestions: getData('countries') }
            },
            {
              name: 'fiatCurrency',
              size: sizes.fiatCurrency,
              view: get('code'),
              input: Autocomplete,
              inputProps: { suggestions: getData('currencies') }
            },
            {
              name: 'languages',
              size: sizes.languages,
              input: AutocompleteMultiple,
              view: displayCodeArray,
              inputProps: { suggestions: getData('languages') }
            },
            {
              name: 'cryptoCurrencies',
              size: sizes.languages,
              input: AutocompleteMultiple,
              view: displayCodeArray,
              inputProps: { suggestions: getData('cryptoCurrencies') }
            },
            {
              name: 'showRates',
              size: sizes.showRates,
              input: Checkbox,
              view: it => it ? 'true' : 'false'
            }
          ]}
        />
      </Form>
    )
  }
)

export default MainForm
