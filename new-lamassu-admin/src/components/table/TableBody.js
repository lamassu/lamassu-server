import React, { memo } from 'react'

const TableBody = memo(({ children, ...props }) => (
  <tbody {...props}>{children}</tbody>
))

export default TableBody
