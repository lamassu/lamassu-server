import React, { memo } from 'react'
import { TableCell as Td } from '../../components/table'
import { Link } from '../../components/buttons'

const EditCell = memo(({ save, cancel }) => (
  <Td>
    <Link style={{ marginRight: '20px' }} color='secondary' onClick={cancel}>
      Cancel
    </Link>
    <Link color='primary' onClick={save}>
      Save
    </Link>
  </Td>
))

export default EditCell
