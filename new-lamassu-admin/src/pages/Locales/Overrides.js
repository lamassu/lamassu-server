// import React, { useState, memo } from 'react'
// import { Form, FastField } from 'formik'

// import { Link } from '../../components/buttons'
// import {
//   Autocomplete,
//   AutocompleteMultiple,
//   Checkbox
// } from '../../components/inputs'
// import {
//   EditCell,
//   Table,
//   TableHead,
//   TableRow,
//   TableHeader,
//   TableBody,
//   TableCell as TD
// } from '../../components/table'

// import styles from './MainForm.module.scss'

// const Override = memo(
//   ({ values, resetForm, submitForm, errors, editing, setEditing, data }) => {
//     const [submitted, setSubmitted] = useState(false)

//     const save = () => {
//       setSubmitted(true)
//       submitForm()
//     }

//     const cancel = () => {
//       resetForm()
//       setSubmitted(false)
//       setEditing(false)
//     }

//     const ViewFields = (
//       <>
//         <TD>{values.machine && values.machine.display}</TD>
//         <TD>
//           {values.languages && values.languages.map(it => it.code).join(', ')}
//         </TD>
//         <TD>
//           {values.cryptoCurrencies &&
//             values.cryptoCurrencies.map(it => it.code).join(', ')}
//         </TD>
//         <TD>{values.showRates ? 'true' : 'false'}</TD>
//         <TD rightAlign>
//           <Link color='primary' onClick={() => setEditing(true)}>
//             Edit
//           </Link>
//         </TD>
//       </>
//     )

//     const EditFields = (
//       <>
//         <TD>
//           <FastField
//             name='machine'
//             component={Autocomplete}
//             suggestions={data && data.machines}
//           />
//         </TD>
//         <TD>
//           <FastField
//             name='languages'
//             component={AutocompleteMultiple}
//             suggestions={data && data.languages}
//           />
//         </TD>
//         <TD>
//           <FastField
//             name='cryptoCurrencies'
//             component={AutocompleteMultiple}
//             suggestions={data && data.cryptoCurrencies}
//           />
//         </TD>
//         <TD>
//           <FastField name='showRates' component={Checkbox} />
//         </TD>
//         <EditCell save={save} cancel={cancel} />
//       </>
//     )

//     return (
//       <Form>
//         <Table>
//           <colgroup>
//             <col className={styles.bigColumn} />
//             <col className={styles.mediumColumn} />
//             <col className={styles.bigColumn} />
//             <col className={styles.showRates} />
//             <col className={styles.actionColumn} />
//           </colgroup>
//           <TableHead>
//             <TableRow header>
//               <TableHeader>Machine</TableHeader>
//               <TableHeader>Languages</TableHeader>
//               <TableHeader>Crypto Currencies</TableHeader>
//               <TableHeader>Show Rates</TableHeader>
//               <TableHeader />
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             <TableRow error={submitted && errors && errors.length}>
//               {editing ? EditFields : ViewFields}
//             </TableRow>
//           </TableBody>
//         </Table>
//       </Form>
//     )
//   }
// )

// export default Override
