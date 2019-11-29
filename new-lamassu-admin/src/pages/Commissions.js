import React, { useState } from 'react'
import useAxios from '@use-hooks/axios'

// import styles from './Commissions.module.scss'

import { H1, H3, Info1, TL2 } from '../components/typography'
import { Link } from '../components/buttons'
import { TextInput } from '../components/inputs'
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell
} from '../components/table'

const styles = {}
const EditRow = ({ data = {}, commitValues, setEditing }) => {
  const [values, setValues] = React.useState(data)

  const handleChange = name => event => {
    setValues({ ...values, [name]: event.target.value })
  }

  return (
    <>
      <TableCell>
        <TextInput
          large
          required
          className={styles.numberSmallInput}
          value={values.cashInCommission || ''}
          onChange={handleChange('cashInCommission')}
          suffix='%'
        />
      </TableCell>
      <TableCell>
        <TextInput
          large
          className={styles.numberSmallInput}
          value={values.cashOutCommission || ''}
          onChange={handleChange('cashOutCommission')}
          suffix='%'
        />
      </TableCell>
      <TableCell>
        <TextInput
          large
          value={values.cashInFee || ''}
          onChange={handleChange('cashInFee')}
          suffix='EUR'
        />
      </TableCell>
      <TableCell>
        <TextInput
          large
          value={values.minimumTx || ''}
          onChange={handleChange('minimumTx')}
          suffix='EUR'
        />
      </TableCell>
      <TableCell>
        <Link
          color='secondary'
          className={styles.firstLink}
          onClick={() => {
            setEditing(false)
          }}
        >
          Cancel
        </Link>
        <Link
          color='primary'
          submit
          onClick={() => {
            commitValues(values)
            setEditing(false)
          }}
        >
          Save
        </Link>
      </TableCell>
    </>
  )
}

const ViewRow = ({ data, setEditing }) => (
  <>
    <TableCell>
      <Info1 inline className={styles.noMargin}>
        {data.cashInCommission}
      </Info1>
      {data.cashInCommission && (
        <TL2 inline className={styles.suffix}>
          %
        </TL2>
      )}
    </TableCell>
    <TableCell>
      <Info1 inline className={styles.noMargin}>
        {data.cashOutCommission}
      </Info1>
      {data.cashOutCommission && (
        <TL2 inline className={styles.suffix}>
          %
        </TL2>
      )}
    </TableCell>
    <TableCell>
      <Info1 inline className={styles.noMargin}>
        {data.cashInFee}
      </Info1>
      {data.cashOutCommission && (
        <TL2 inline className={styles.suffix}>
          EUR
        </TL2>
      )}
    </TableCell>
    <TableCell>
      <Info1 inline className={styles.noMargin}>
        {data.minimumTx}
      </Info1>
      {data.cashOutCommission && (
        <TL2 inline className={styles.suffix}>
          EUR
        </TL2>
      )}
    </TableCell>
    <TableCell className={styles.centerAlign}>
      <Link color='primary' onClick={() => setEditing(true)}>
        Edit
      </Link>
    </TableCell>
  </>
)

const Commissions = () => {
  const [dataset, setDataset] = useState([{}])

  useAxios({
    url: 'http://localhost:8070/api/config',
    method: 'GET',
    trigger: [],
    customHandler: (err, res) => {
      if (err) return
      if (res) {
        setDataset([res.data])
      }
    }
  })

  const { reFetch } = useAxios({
    url: 'http://localhost:8070/api/config',
    method: 'POST',
    options: {
      data: dataset[0]
    }
  })

  const commitValues = (values, idx) => {
    const clonedDs = dataset.slice()
    clonedDs[idx] = Object.assign({}, clonedDs[idx], values)
    setDataset(clonedDs)
    reFetch()
  }

  return (
    <>
      <H1>Commissions</H1>
      <H3>Default Setup</H3>
      <form className={styles.tableWrapper}>
        <Table>
          <TableHead>
            <TableRow header>
              <TableHeader rowSpan='2'>Cash-in</TableHeader>
              <TableHeader rowSpan='2'>Cash-out</TableHeader>
              <TableHeader colSpan='2' className={styles.multiRowHeader}>
                Cash-in only
              </TableHeader>
              <TableHeader className={styles.centerAlign} rowSpan='2'>
                Edit
              </TableHeader>
            </TableRow>
            <TableRow header>
              <TableHeader>Fixed Fee</TableHeader>
              <TableHeader>Minimum Tx</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* // <EditableRow
            //   key={idx}
            //   data={it}
            //   commitValues={value => commitValues(value, idx)}
            //   EditRow={EditRow}
            //   ViewRow={ViewRow}
            // /> */}
          </TableBody>
        </Table>
      </form>
    </>
  )
}

export default Commissions
