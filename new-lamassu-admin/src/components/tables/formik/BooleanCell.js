import React, { memo } from 'react'

import BooleanCell from '../BooleanCell'

const BooleanCellFormik = memo(({ label, ...props }) => {
  const { name, value } = props.field

  return <BooleanCell name={name} value={value === 'true'} {...props} />
})

export default BooleanCellFormik
